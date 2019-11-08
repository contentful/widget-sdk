import $ from 'jquery';
import { assign, get } from 'utils/Collections.es6';
import * as K from 'utils/kefir.es6';
import keycodes from 'utils/keycodes.es6';

import { ENVIRONMENTS_FLAG } from 'featureFlags.es6';

export default function createController($scope) {
  $(window).on('keyup', handleEsc);

  $scope.$on('$destroy', () => {
    $(window).off('keyup', handleEsc);
  });

  let navState;
  let state = {
    sidePanelIsShown: false,
    closeSidePanel,
    gotoOrgSettings,
    canGotoOrgSettings: false,
    viewingOrgSettings: false,
    spacesByOrg: null,
    currOrg: null,
    currentSpaceId: null,
    currentEnvId: null,
    orgs: null,
    goToSpace,
    canCreateSpaceInCurrOrg: false,
    showCreateSpaceModal,
    openOrgsDropdown,
    setCurrOrg,
    orgDropdownIsShown: false,
    closeOrgsDropdown,
    canCreateOrg: false,
    createNewOrg,
    openedSpaceId: null,
    setOpenedSpaceId,
    environmentsEnabled: false
  };

  $scope.loaded = false;

  let Navigator;
  let navState$;
  let NavStates;
  let TokenStore;
  let OrgRoles;
  let CreateSpace;
  let AccessChecker;
  let LD;
  let logger;
  let renderSidepanel;

  async function initialize() {
    [
      Navigator,
      { navState$, NavStates },
      TokenStore,
      OrgRoles,
      CreateSpace,
      AccessChecker,
      LD,
      logger,
      { default: renderSidepanel }
    ] = await Promise.all([
      import('states/Navigator.es6'),
      import('navigation/NavState.es6'),
      import('services/TokenStore.es6'),
      import('services/OrganizationRoles.es6'),
      import('services/CreateSpace.es6'),
      import('access_control/AccessChecker'),
      import('utils/LaunchDarkly/index.es6'),
      import('services/logger.es6'),
      import('./SidepanelView.es6')
    ]);

    K.onValueScope($scope, TokenStore.organizations$, orgs => {
      state = assign(state, { orgs: orgs || [] });
      render();
    });

    K.onValueScope($scope, TokenStore.spacesByOrganization$, spacesByOrg => {
      state = assign(state, { spacesByOrg: spacesByOrg || {} });
      render();
    });

    K.onValueScope($scope, navState$.combine(AccessChecker.isInitialized$), values => {
      if (values[1]) {
        navState = values[0];
        state = assign(state, {
          currentSpaceId: get(navState, ['space', 'sys', 'id']),
          currentEnvId: get(navState, ['env', 'sys', 'id'], 'master')
        });
        setCurrOrg(navState.org || get(state, ['orgs', 0]));
        render();
      }
    });

    LD.onFeatureFlag($scope, ENVIRONMENTS_FLAG, isEnabled => {
      state = assign(state, { environmentsEnabled: isEnabled });
      render();
    });

    $scope.$watch('sidePanelIsShown', sidePanelIsShown => {
      state = assign(state, { sidePanelIsShown });
      render();
    });

    $scope.loaded = true;

    render();
  }

  function render() {
    if (!$scope.loaded) {
      return;
    }

    $scope.component = renderSidepanel(state);
    $scope.$applyAsync();
  }

  initialize();

  function gotoOrgSettings() {
    closeSidePanel();
    const orgSettingsPath = ['account', 'organizations'];
    const orgId = state.currOrg.sys.id;
    if (OrgRoles.isOwnerOrAdmin(state.currOrg)) {
      const hasNewPricing = state.currOrg.pricingVersion === 'pricing_version_2';
      orgSettingsPath.push(hasNewPricing ? 'subscription_new' : 'subscription');
    } else {
      orgSettingsPath.push('teams');
    }

    Navigator.go({
      path: orgSettingsPath,
      params: { orgId }
    });
  }

  function createNewOrg() {
    closeSidePanel();
    Navigator.go({
      path: ['account', 'new_organization']
    });
  }

  function goToSpace(spaceId, envId, isMaster) {
    envId = isMaster ? undefined : envId;
    const path = ['spaces', 'detail'].concat(envId ? ['environment'] : []);

    closeSidePanel();
    Navigator.go({
      path,
      params: {
        spaceId,
        environmentId: envId
      },
      options: { reload: true }
    }).catch(err => {
      // Collapse environment list if navigation failed
      // e.g. when environment was deleted
      setOpenedSpaceId(null);
      logger.logException(err);
    });
  }

  function showCreateSpaceModal() {
    closeSidePanel();
    CreateSpace.showDialog(state.currOrg.sys.id);
  }

  function handleEsc(ev) {
    if (ev.keyCode === keycodes.ESC) {
      $scope.$apply(closeSidePanel);
    }
  }

  function closeSidePanel() {
    closeOrgsDropdown();
    $scope.sidePanelIsShown = false;
  }

  function openOrgsDropdown(event) {
    if (!state.orgDropdownIsShown) {
      state = assign(state, { orgDropdownIsShown: true });
      render();
      // Don't bubble click event to container that would close the dropdown
      event.stopPropagation();
    }
  }

  function closeOrgsDropdown() {
    state = assign(state, { orgDropdownIsShown: false });
    render();
  }

  function setCurrOrg(org) {
    // Collapse environment list if changing organization
    if (get(state, ['currOrg', 'sys', 'id']) !== get(org, ['sys', 'id'])) {
      state = assign(state, { openedSpaceId: null });
    }

    state = assign(state, { currOrg: org });
    refreshPermissions(navState, org);
    render();
  }

  function setOpenedSpaceId(spaceId) {
    state = assign(state, { openedSpaceId: spaceId });
    render();
  }

  function refreshPermissions(navState, org) {
    if (navState && org) {
      const orgId = org.sys.id;

      state = assign(state, {
        canCreateSpaceInCurrOrg: AccessChecker.canCreateSpaceInOrganization(orgId),
        viewingOrgSettings:
          navState instanceof NavStates.OrgSettings && navState.org.sys.id === orgId,
        canCreateOrg: AccessChecker.canCreateOrganization()
      });

      render();
    }
  }
}
