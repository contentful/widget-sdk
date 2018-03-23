import { assign, get } from 'utils/Collections';
import * as K from 'utils/kefir';
import keycodes from 'utils/keycodes';

import * as Navigator from 'states/Navigator';

import { navState$, NavStates } from 'navigation/NavState';
import * as TokenStore from 'services/TokenStore';
import * as OrgRoles from 'services/OrganizationRoles';
import * as CreateSpace from 'services/CreateSpace';
import * as AccessChecker from 'access_control/AccessChecker';
import * as LD from 'utils/LaunchDarkly';

import renderSidepanel from './SidepanelView';

const ENVIRONMENTS_FLAG_NAME = 'feature-dv-11-2017-environments';

export default function createController ($scope, $window) {
  $window.on('keyup', handleEsc);

  $scope.$on('$destroy', function () {
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

  function render () {
    $scope.component = renderSidepanel(state);
    $scope.$applyAsync();
  }

  render();

  $scope.$watch('sidePanelIsShown', function (sidePanelIsShown) {
    state = assign(state, {sidePanelIsShown: sidePanelIsShown});
    render();
  });

  K.onValueScope($scope, TokenStore.organizations$, function (orgs) {
    state = assign(state, {orgs: orgs || []});
    render();
  });

  K.onValueScope($scope, TokenStore.spacesByOrganization$, function (spacesByOrg) {
    state = assign(state, {spacesByOrg: spacesByOrg || {}});
    render();
  });

  K.onValueScope($scope, navState$.combine(AccessChecker.isInitialized$), function (values) {
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

  LD.onFeatureFlag($scope, ENVIRONMENTS_FLAG_NAME, function (isEnabled) {
    state = assign(state, {environmentsEnabled: isEnabled});
    render();
  });

  function gotoOrgSettings () {
    closeSidePanel();
    const orgSettingsPath = ['account', 'organizations'];
    const hasNewPricing = state.currOrg.pricingVersion === 'pricing_version_2';
    orgSettingsPath.push(hasNewPricing ? 'subscription_new' : 'subscription');

    Navigator.go({
      path: orgSettingsPath,
      params: { orgId: state.currOrg.sys.id }
    });
  }

  function createNewOrg () {
    closeSidePanel();
    Navigator.go({
      path: ['account', 'organizations', 'new']
    });
  }

  function goToSpace (spaceId, envId) {
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
    }).catch((err) => {
      // Collapse environment list if navigation failed
      // e.g. when environment was deleted
      setOpenedSpaceId(null);
      throw err;
    });
  }

  function showCreateSpaceModal () {
    closeSidePanel();
    CreateSpace.showDialog(state.currOrg.sys.id);
  }

  function handleEsc (ev) {
    if (ev.keyCode === keycodes.ESC) {
      $scope.$apply(closeSidePanel);
    }
  }

  function closeSidePanel () {
    closeOrgsDropdown();
    $scope.sidePanelIsShown = false;
  }

  function openOrgsDropdown (event) {
    if (!state.orgDropdownIsShown) {
      state = assign(state, {orgDropdownIsShown: true});
      render();
      // Don't bubble click event to container that would close the dropdown
      event.stopPropagation();
    }
  }

  function closeOrgsDropdown () {
    state = assign(state, {orgDropdownIsShown: false});
    render();
  }

  function setCurrOrg (org) {
    // Collapse environment list if changing organization
    if (get(state, ['currOrg', 'sys', 'id']) !== get(org, ['sys', 'id'])) {
      state = assign(state, {openedSpaceId: null});
    }

    state = assign(state, {currOrg: org});
    refreshPermissions(navState, org);
    render();
  }

  function setOpenedSpaceId (spaceId) {
    state = assign(state, {openedSpaceId: spaceId});
    render();
  }

  function refreshPermissions (navState, org) {
    if (navState && org) {
      const orgId = org.sys.id;

      state = assign(state, {
        canGotoOrgSettings: OrgRoles.isOwnerOrAdmin(org),
        canCreateSpaceInCurrOrg: AccessChecker.canCreateSpaceInOrganization(orgId),
        viewingOrgSettings: (navState instanceof NavStates.OrgSettings) && navState.org.sys.id === orgId,
        canCreateOrg: AccessChecker.canCreateOrganization()
      });

      render();
    }
  }
}
