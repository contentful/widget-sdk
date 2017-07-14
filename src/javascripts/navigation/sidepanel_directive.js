'use strict';

angular.module('contentful')
/**
 * @ngdoc directive
 * @name cfNavSidePanel
 *
 * This directive display the new navigation side panel.
 * It depends on the following paramters.
 *
 * @param {object} accessChecker
 *   This service is used to check if the user can create
 *   a space in an org.
 * @param {object} OrganizationRoles
 *   This service is used to check if the user is an owner or
 *   admin of an org.
 * @param {object} TokenStore
 *   This service is provides orgs current user belongs to and
 *   a map of org id to list of spaces.
 * @param {object} spaceContext
 *   This service provides all the data we need for the current
 *   space user is in.
 * @param {object} CreateSpace
 *   This service gives us a way of showing the create space modal
 *   for the given org id.
 * @param {object} Kefir
 *   This service is used to deal with kefir buses and streams.
 * @param {object} Navigator
 *   This service is used to perform state transitions.
 * @param {object} $stateParams
 *   This service is used to grab params for current state.
 */
.directive('cfNavSidePanel', ['require', function (require) {
  // access related imports
  var accessChecker = require('accessChecker');
  var orgRoles = require('services/OrganizationRoles');

  // core data related imports
  var tokenStore = require('services/TokenStore');
  var spacesByOrg$ = tokenStore.spacesByOrganization$;
  var orgs$ = tokenStore.organizations$;

  var spaceContext = require('spaceContext');

  var showCreateSpaceModal = require('services/CreateSpace').showDialog;

  // stream utils import
  var K = require('utils/kefir');

  // state transition related import
  var Navigator = require('states/Navigator');
  var $stateParams = require('$stateParams');

  // view template import
  var sidepanelTemplate = require('navigation/Sidepanel.template').default();

  return {
    restrict: 'E',
    template: sidepanelTemplate,
    scope: {},
    replace: true,
    controller: ['$scope', function ($scope) {
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
        return ($stateParams.orgId && _.find($scope.orgs, function (org) { return org.sys.id === $stateParams.orgId; })) ||
          (spaceContext.organizationContext && spaceContext.organizationContext.organization) ||
          ($scope.orgs && $scope.orgs[0]);
      }
    }]
  };
}]);
