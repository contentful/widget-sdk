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
  var $state = require('$state');
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

      $scope.sidePanelIsShown = false;
      $scope.orgDropdownIsShown = false;

      K.onValueScope($scope, orgs$.combine(accessChecker.isInitialized$), function (values) {
        $scope.orgs = values[1] && values[0] || [];
        if (!$scope.currOrg) {
          setCurrOrg(getCurrCommittedOrg());
        }
      });
      K.onValueScope($scope, spacesByOrg$, function (spacesByOrg) {
        $scope.spacesByOrg = spacesByOrg || {};
      });

      // TODO add kefir property
      $scope.$watch(function () {
        return _.get(spaceContext, 'space.data');
      }, function (currSpace) {
        $scope.currSpace = currSpace;
      });

      $scope.setCurrOrg = setCurrOrg;
      $scope.closeSidePanel = closeSidePanel;
      $scope.openSidePanel = openSidePanel;
      $scope.toggleOrgsDropdown = toggleOrgsDropdown;

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
        refreshPermissions();
      }

      function refreshPermissions () {
        var org = $scope.currOrg;
        if (org) {
          var orgId = org.sys.id;

          $scope.canGotoOrgSettings = orgRoles.isOwnerOrAdmin(org);
          $scope.canCreateSpaceInCurrOrg = accessChecker.canCreateSpaceInOrganization(orgId);
          $scope.viewingOrgSettings = $state.includes('account') && $state.params.orgId === orgId;
          $scope.twoLetterOrgName = org.name.slice(0, 2).toUpperCase();
        }
      }

      function openSidePanel () {
        $scope.orgDropdownIsShown = false;
        setCurrOrg(getCurrCommittedOrg());
        $scope.sidePanelIsShown = true;
      }

      function closeSidePanel () {
        $scope.sidePanelIsShown = false;
      }

      function toggleOrgsDropdown () {
        $scope.orgDropdownIsShown = !$scope.orgDropdownIsShown;
      }

      function getCurrCommittedOrg () {
        // return org based on orgId in url or based on what's in spaceContext or finally
        // just return the 1st org from list of orgs
        return getOrgById($state.params.orgId) ||
          _.get(spaceContext, 'organizationContext.organization') ||
          _.get($scope, 'orgs[0]');
      }

      function getOrgById (orgId) {
        return orgId && _.find($scope.orgs, function (org) { return org.sys.id === orgId; });
      }
    }]
  };
}]);
