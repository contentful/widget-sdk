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
  var sidepanelTemplate = require('navigation/templates/Sidepanel.template').default();

  return {
    restrict: 'E',
    template: sidepanelTemplate,
    scope: {
      sidePanelIsShown: '=isShown'
    },
    replace: true,
    controller: ['$scope', function ($scope) {
      var navState;
      var win = $($window);

      win.on('keyup', handleEsc);

      $scope.$on('$destroy', function () {
        win.off('keyup', handleEsc);
      });

      $scope.orgDropdownIsShown = false;

      K.onValueScope($scope, orgs$, function (orgs) {
        $scope.orgs = orgs || [];
      });

      K.onValueScope($scope, spacesByOrg$, function (spacesByOrg) {
        $scope.spacesByOrg = spacesByOrg || {};
      });

      K.onValueScope($scope, navState$.combine(accessChecker.isInitialized$), function (values) {
        if (values[1]) {
          navState = values[0];
          $scope.currSpace = navState.space;
          setCurrOrg(navState.org || _.get($scope, 'orgs[0]'));
        }
      });

      $scope.setCurrOrg = setCurrOrg;
      $scope.closeSidePanel = closeSidePanel;
      $scope.openOrgsDropdown = openOrgsDropdown;
      $scope.closeOrgsDropdown = closeOrgsDropdown;
      $scope.gotoOrgSettings = function () {
        closeSidePanel();
        var orgSettingsPath = ['account', 'organizations'];
        var hasNewPricing = $scope.currOrg.pricingVersion === 'pricing_version_2';
        orgSettingsPath.push(hasNewPricing ? 'subscription_new' : 'subscription');

        Navigator.go({
          path: orgSettingsPath,
          params: { orgId: $scope.currOrg.sys.id }
        });
      };
      $scope.createNewOrg = function () {
        closeSidePanel();
        Navigator.go({
          path: ['account', 'organizations', 'new']
        });
      };
      $scope.setAndGotoSpace = function (space) {
        closeSidePanel();
        Navigator.go({
          path: ['spaces', 'detail'],
          params: { spaceId: space.sys.id },
          options: { reload: true }
        });
      };
      $scope.showCreateSpaceModal = function () {
        closeSidePanel();
        showCreateSpaceModal($scope.currOrg.sys.id);
      };

      function handleEsc (ev) {
        if (ev.keyCode === keycodes.ESC) {
          $scope.$apply(closeSidePanel);
        }
      }

      function closeSidePanel () {
        closeOrgsDropdown();
        $scope.sidePanelIsShown = false;
      }

      function openOrgsDropdown ($event) {
        if (!$scope.orgDropdownIsShown) {
          $scope.orgDropdownIsShown = true;

          // Don't bubble click event to container that would close the dropdown
          $event.stopPropagation();
        }
      }


      function closeOrgsDropdown () {
        $scope.orgDropdownIsShown = false;
      }

      function setCurrOrg (org) {
        $scope.currOrg = org;
        refreshPermissions(navState, org);
      }

      function refreshPermissions (navState, org) {
        if (navState && org) {
          var orgId = org.sys.id;

          $scope.canGotoOrgSettings = orgRoles.isOwnerOrAdmin(org);
          $scope.canCreateSpaceInCurrOrg = accessChecker.canCreateSpaceInOrganization(orgId);
          $scope.viewingOrgSettings =
            (navState instanceof NavStates.OrgSettings) && navState.org.sys.id === orgId;
          $scope.canCreateOrg = accessChecker.canCreateOrganization();
          $scope.twoLetterOrgName = org.name.slice(0, 2).toUpperCase();
        }
      }
    }]
  };
}]);
