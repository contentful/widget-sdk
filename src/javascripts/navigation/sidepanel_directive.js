'use strict';

angular.module('contentful')
/**
 * @ngdoc directive
 * @name cfNavSidePanel
 *
 * This directive display the new navigation side panel.
 */
.directive('cfNavSidePanel', ['require', function (require) {
  var accessChecker = require('accessChecker');
  var orgRoles = require('services/OrganizationRoles');
  var tokenStore = require('services/TokenStore');
  var spacesByOrg$ = tokenStore.spacesByOrganization$;
  var orgs$ = tokenStore.organizations$;
  var spaceContext = require('spaceContext');
  var showCreateSpaceModal = require('services/CreateSpace').showDialog;
  var K = require('utils/kefir');
  var Navigator = require('states/Navigator');
  var $stateParams = require('$stateParams');
  var sidepanelTemplate = require('navigation/Sidepanel.template').default();

  // Begin feature flag code - feature-bv-06-2017-use-new-navigation
  var LD = require('utils/LaunchDarkly');
  // End feature flag code - feature-bv-06-2017-use-new-navigation

  return {
    restrict: 'E',
    template: sidepanelTemplate,
    scope: {},
    replace: true,
    controller: ['$scope', function ($scope) {
      // Begin feature flag code - feature-bv-06-2017-use-new-navigation
      LD.setOnScope($scope, 'feature-bv-06-2017-use-new-navigation', 'useNewNavigation');
      // End feature flag code - feature-bv-06-2017-use-new-navigation

      // side panel visibility
      $scope.sidePanelIsShown = false;
      $scope.toggleSidePanel = function (committedOrg) {
        $scope.currOrg = committedOrg || getCurrentCommittedOrg();
        $scope.sidePanelIsShown = !$scope.sidePanelIsShown;
        $scope.orgDropdownIsShown = false;
      };

      // List of org objects
      $scope.orgs = [];
      K.onValueScope($scope, orgs$, function (orgs) {
        $scope.orgs = orgs || [];
      });
      $scope.toggleOrgsDropdown = function () {
        $scope.orgDropdownIsShown = !$scope.orgDropdownIsShown;
      };

      // Org object representing the org current space belongs to.
      // This will be switched by choosing a new org from the dropdown
      // and selecting an operation on it like create space or goto settings.
      // If no operation is performed, it is reverted back to previously
      // selected org when the side panel is closed.
      $scope.$watch(function () {
        return getCurrentCommittedOrg();
      }, function (org) {
        $scope.currOrg = org || $scope.currOrg;
      });

      // this is separated from the watcher above as currOrg
      // can be changed by user action as well
      $scope.$watch(function () {
        return $scope.currOrg;
      }, function (org) {
        if (org) {
          var orgId = org.sys.id;

          $scope.canGotoOrgSettings = orgRoles.isOwnerOrAdmin(org);
          $scope.canCreateSpaceInCurrOrg = accessChecker.canCreateSpaceInOrganization(orgId);
          $scope.twoLetterOrgName = org.name.slice(0, 2).toUpperCase();
          $scope.viewingOrgSettings = $stateParams.orgId === orgId;
        }
      });

      // mark org settings as active if org id is in state params and curr
      // org id is same as state params org id
      $scope.$watch(function () {
        return $stateParams.orgId;
      }, function (orgId) {
        $scope.viewingOrgSettings = !!$scope.currOrg && $scope.currOrg.sys.id === orgId;
      });
      $scope.setCurrOrg = function (org) {
        $scope.currOrg = org;
      };
      $scope.gotoOrgSettings = function () {
        // "commit" the curr org since goto org settings was clicked
        $scope.toggleSidePanel($scope.currOrg);

        if (orgRoles.isOwnerOrAdmin($scope.currOrg)) {
          Navigator.go({
            path: ['account', 'organizations', 'subscription'],
            params: { orgId: $scope.currOrg.sys.id }
          });
        }
      };
      $scope.createNewOrg = function () {
        $scope.toggleSidePanel();
        Navigator.go({
          path: ['account', 'organizations', 'new']
        });
      };

      // Map of orgId -> [Space]
      $scope.spacesByOrg = {};
      K.onValueScope($scope, spacesByOrg$, function (spacesByOrg) {
        $scope.spacesByOrg = spacesByOrg;
      });
      $scope.currSpace = getCurrSpace();
      $scope.$watch(function () {
        return getCurrSpace();
      }, function (space) {
        $scope.currSpace = space;
      });
      $scope.setAndGotoSpace = function (space) {
        $scope.currSpace = space;

        $scope.toggleSidePanel();
        Navigator.go({
          path: ['spaces', 'detail'],
          params: { spaceId: space.sys.id }
        });
      };
      // show space creation modal for given org id
      $scope.showCreateSpaceModal = function (orgId) {
        $scope.toggleSidePanel();
        showCreateSpaceModal(orgId);
      };

      function getCurrSpace () {
        return spaceContext.space && spaceContext.space.data;
      }

      function getCurrentCommittedOrg () {
        // return org based on orgId in url or based on what's in spaceContext or finally
        // just return the 1st org from list of orgs
        var org;
        if ($stateParams.orgId) {
          org = _.find($scope.orgs, function (org) { return org.sys.id === $stateParams.orgId; });
        }
        org = org || _.get(spaceContext, 'organizationContext.organization');
        return org || _.get($scope, 'orgs[0]');
      }
    }]
  };
}]);
