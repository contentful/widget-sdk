'use strict';

angular.module('contentful')
/**
 * @ngdoc directive
 * @name cfNavSidePanel
 *
 * This directive display the new navigation side panel.
 */
.directive('cfNavSidepanel', ['require', function (require) {
  var $window = require('$window');
  var keycodes = require('utils/keycodes').default;

  var accessChecker = require('accessChecker');
  var orgRoles = require('services/OrganizationRoles');
  var TokenStore = require('services/TokenStore');
  var spacesByOrg$ = TokenStore.spacesByOrganization$;
  var orgs$ = TokenStore.organizations$;
  var showCreateSpaceModal = require('services/CreateSpace').showDialog;
  var K = require('utils/kefir');
  var NavStates = require('navigation/NavState').NavStates;
  var navState$ = require('navigation/NavState').navState$;
  var Navigator = require('states/Navigator');
  var assign = require('utils/Collections').assign;
  var renderSidepanel = require('navigation/templates/SidepanelView').default;

  return {
    restrict: 'E',
    template: '<cf-component-bridge component="component" />',
    scope: {
      sidePanelIsShown: '=isShown'
    },
    controller: ['$scope', function ($scope) {
      var navState;
      var win = $($window);

      win.on('keyup', handleEsc);

      $scope.$on('$destroy', function () {
        win.off('keyup', handleEsc);
      });

      var state = {
        sidePanelIsShown: false,
        closeSidePanel: closeSidePanel,
        gotoOrgSettings: gotoOrgSettings,
        canGotoOrgSettings: false,
        viewingOrgSettings: false,
        spacesByOrg: null,
        currOrg: null,
        currSpace: null,
        orgs: null,
        setAndGotoSpace: setAndGotoSpace,
        canCreateSpaceInCurrOrg: false,
        showCreateSpaceModal: showCreateSpaceModalTest,
        openOrgsDropdown: openOrgsDropdown,
        setCurrOrg: setCurrOrg,
        orgDropdownIsShown: false,
        closeOrgsDropdown: closeOrgsDropdown,
        canCreateOrg: false,
        createNewOrg: createNewOrg
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

      K.onValueScope($scope, orgs$, function (orgs) {
        state = assign(state, {orgs: orgs || []});
        render();
      });

      K.onValueScope($scope, spacesByOrg$, function (spacesByOrg) {
        state = assign(state, {spacesByOrg: spacesByOrg || {}});
        render();
      });

      K.onValueScope($scope, navState$.combine(accessChecker.isInitialized$), function (values) {
        if (values[1]) {
          navState = values[0];
          state = assign(state, {currSpace: navState.space});
          setCurrOrg(navState.org || _.get(state, 'orgs[0]'));
          render();
        }
      });

      $scope.closeSidePanel = closeSidePanel;
      $scope.closeOrgsDropdown = closeOrgsDropdown;

      function gotoOrgSettings () {
        closeSidePanel();
        var orgSettingsPath = ['account', 'organizations'];
        var hasNewPricing = state.currOrg.pricingVersion === 'pricing_version_2';
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

      function setAndGotoSpace (space) {
        closeSidePanel();
        Navigator.go({
          path: ['spaces', 'detail'],
          params: { spaceId: space.sys.id },
          options: { reload: true }
        });
      }

      function showCreateSpaceModalTest () {
        closeSidePanel();
        showCreateSpaceModal(state.currOrg.sys.id);
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
        state = assign(state, {currOrg: org});
        refreshPermissions(navState, org);
        render();
      }

      function refreshPermissions (navState, org) {
        if (navState && org) {
          var orgId = org.sys.id;

          state = assign(state, {
            canGotoOrgSettings: orgRoles.isOwnerOrAdmin(org),
            canCreateSpaceInCurrOrg: accessChecker.canCreateSpaceInOrganization(orgId),
            viewingOrgSettings: (navState instanceof NavStates.OrgSettings) && navState.org.sys.id === orgId,
            canCreateOrg: accessChecker.canCreateOrganization()
          });

          render();
        }
      }
    }]
  };
}]);
