'use strict';

angular.module('contentful')
/**
 * @ngdoc directive
 * @name cfNavSidePanel
 *
 * This directive display the new navigation side panel.
 */
.directive('cfNavSidepanel', ['require', function (require) {
  var accessChecker = require('accessChecker');
  var orgRoles = require('services/OrganizationRoles');
  var tokenStore = require('services/TokenStore');
  var spacesByOrg$ = tokenStore.spacesByOrganization$;
  var orgs$ = tokenStore.organizations$;
  var showCreateSpaceModal = require('services/CreateSpace').showDialog;
  var K = require('utils/kefir');
  var NavStates = require('navigation/NavState').NavStates;
  var navState$ = require('navigation/NavState').navState$;
  var Navigator = require('states/Navigator');
  var sidepanelTemplate = require('navigation/Sidepanel.template').default();

  return {
    restrict: 'E',
    template: sidepanelTemplate,
    scope: {
      sidePanelIsShown: '=isShown'
    },
    replace: true,
    controller: ['$scope', function ($scope) {
      $scope.orgDropdownIsShown = false;
      var navState;

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
      $scope.closeSidePanel = function () {
        $scope.sidePanelIsShown = false;
      };

      $scope.openSidePanel = function () {
        $scope.orgDropdownIsShown = false;
        $scope.sidePanelIsShown = true;
      };

      $scope.toggleOrgsDropdown = function () {
        $scope.orgDropdownIsShown = !$scope.orgDropdownIsShown;
      };

      $scope.gotoOrgSettings = function () {
        $scope.closeSidePanel();
        Navigator.go({
          path: ['account', 'organizations', 'subscription'],
          params: { orgId: $scope.currOrg.sys.id }
        });
      };
      $scope.createNewOrg = function () {
        $scope.closeSidePanel();
        Navigator.go({
          path: ['account', 'organizations', 'new']
        });
      };
      $scope.setAndGotoSpace = function (space) {
        $scope.closeSidePanel();
        Navigator.go({
          path: ['spaces', 'detail'],
          params: { spaceId: space.sys.id }
        });
      };
      $scope.showCreateSpaceModal = function () {
        $scope.closeSidePanel();
        showCreateSpaceModal($scope.currOrg.sys.id);
      };

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
          $scope.twoLetterOrgName = org.name.slice(0, 2).toUpperCase();
        }
      }
    }]
  };
}]);
