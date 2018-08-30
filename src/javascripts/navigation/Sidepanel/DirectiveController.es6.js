import { assign, get } from 'utils/Collections.es6';
import * as K from 'utils/kefir.es6';
import keycodes from 'utils/keycodes.es6';

import * as Navigator from 'states/Navigator.es6';

import { navState$, NavStates } from 'navigation/NavState.es6';
import * as TokenStore from 'services/TokenStore.es6';
import * as OrgRoles from 'services/OrganizationRoles.es6';
import * as CreateSpace from 'services/CreateSpace.es6';
import * as AccessChecker from 'access_control/AccessChecker';
import * as LD from 'utils/LaunchDarkly';
import logger from 'logger';

import renderSidepanel from './SidepanelView.es6';

const ENVIRONMENTS_FLAG_NAME = 'feature-dv-11-2017-environments';

export default function createController($scope, $window) {
  $window.on('keyup', handleEsc);

  $scope.$on('$destroy', () => {
    $window.off('keyup', handleEsc);
  });

  let navState;
  let state = {
    sidePanelIsShown: false,
    closeSidePanel: closeSidePanel,
    gotoOrgSettings: gotoOrgSettings,
    canGotoOrgSettings: false,
    viewingOrgSettings: false,
    spacesByOrg: null,
    currOrg: null,
    currentSpaceId: null,
    currentEnvId: null,
    orgs: null,
    goToSpace: goToSpace,
    canCreateSpaceInCurrOrg: false,
    showCreateSpaceModal: showCreateSpaceModal,
    openOrgsDropdown: openOrgsDropdown,
    setCurrOrg: setCurrOrg,
    orgDropdownIsShown: false,
    closeOrgsDropdown: closeOrgsDropdown,
    canCreateOrg: false,
    createNewOrg: createNewOrg,
    openedSpaceId: null,
    setOpenedSpaceId: setOpenedSpaceId,
    environmentsEnabled: false
  };

  function render() {
    $scope.component = renderSidepanel(state);
    $scope.$applyAsync();
  }

  render();

  $scope.$watch('sidePanelIsShown', sidePanelIsShown => {
    state = assign(state, { sidePanelIsShown: sidePanelIsShown });
    render();
  });

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

  LD.onFeatureFlag($scope, ENVIRONMENTS_FLAG_NAME, isEnabled => {
    state = assign(state, { environmentsEnabled: isEnabled });
    render();
  });

  function gotoOrgSettings() {
    closeSidePanel();
    const orgSettingsPath = ['account', 'organizations'];
    const hasNewPricing = state.currOrg.pricingVersion === 'pricing_version_2';
    orgSettingsPath.push(hasNewPricing ? 'subscription_new' : 'subscription');

    Navigator.go({
      path: orgSettingsPath,
      params: { orgId: state.currOrg.sys.id }
    });
  }

  function createNewOrg() {
    closeSidePanel();
    Navigator.go({
      path: ['account', 'organizations', 'new']
    });
  }

  function goToSpace(spaceId, envId) {
    envId = envId === 'master' ? undefined : envId;
    const path = ['spaces', 'detail'].concat(envId ? ['environment'] : []);

    closeSidePanel();
    Navigator.go({
      path: path,
      params: {
        spaceId: spaceId,
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
        canGotoOrgSettings: OrgRoles.isOwnerOrAdmin(org),
        canCreateSpaceInCurrOrg: AccessChecker.canCreateSpaceInOrganization(orgId),
        viewingOrgSettings:
          navState instanceof NavStates.OrgSettings && navState.org.sys.id === orgId,
        canCreateOrg: AccessChecker.canCreateOrganization()
      });

      render();
    }
  }
}
