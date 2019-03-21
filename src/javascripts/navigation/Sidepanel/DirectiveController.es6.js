import { assign, get } from 'utils/Collections.es6';
import * as K from 'utils/kefir.es6';
import keycodes from 'utils/keycodes.es6';

import * as Navigator from 'states/Navigator.es6';

import { TEAMS_FOR_MEMBERS as TEAMS_FOR_MEMBERS_FF } from 'featureFlags.es6';
import { navState$, NavStates } from 'navigation/NavState.es6';
import * as TokenStore from 'services/TokenStore.es6';
import * as OrgRoles from 'services/OrganizationRoles.es6';
import * as CreateSpace from 'services/CreateSpace.es6';
import * as AccessChecker from 'access_control/AccessChecker/index.es6';
import * as LD from 'utils/LaunchDarkly/index.es6';
import * as logger from 'services/logger.es6';

import { open as openProjectsCreationModal } from 'app/Projects/ProjectCreationModal.es6';

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
    environmentsEnabled: false,

    showCreateProjectModal,
    goToProject
  };

  function render() {
    $scope.component = renderSidepanel(state);
    $scope.$applyAsync();
  }

  render();

  $scope.$watch('sidePanelIsShown', sidePanelIsShown => {
    state = assign(state, { sidePanelIsShown });
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

  LD.onFeatureFlag($scope, TEAMS_FOR_MEMBERS_FF, isEnabled => {
    state = assign(state, { teamsForMembersFF: isEnabled });
    render();
  });

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
      path: ['account', 'organizations', 'new']
    });
  }

  function goToSpace(spaceId, envId) {
    envId = envId === 'master' ? undefined : envId;
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

  function goToProject(projectId) {
    const {
      currOrg: {
        sys: { id: orgId }
      }
    } = state;

    closeSidePanel();

    Navigator.go({
      path: ['projects', 'home'],
      params: {
        orgId,
        projectId
      }
    });
  }

  function showCreateSpaceModal() {
    closeSidePanel();
    CreateSpace.showDialog(state.currOrg.sys.id);
  }

  function showCreateProjectModal() {
    closeSidePanel();
    openProjectsCreationModal(state.currOrg.sys.id);
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
