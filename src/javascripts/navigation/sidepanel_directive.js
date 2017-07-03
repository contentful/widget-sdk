'use strict';

angular.module('contentful')
.directive('cfNavSidePanel', ['require', function (require) {
  // access related imports
  var canCreateSpaceInOrg = require('accessChecker').canCreateSpaceInOrganization;
  var orgRoles = require('services/OrganizationRoles');
  var isOwnerOrAdmin = orgRoles.isOwnerOrAdmin;

  // core data related imports
  var tokenStore = require('services/TokenStore');
  var spacesByOrg$ = tokenStore.spacesByOrganization$;
  var orgs$ = tokenStore.organizations$;


  var spaceContext = require('spaceContext');

  var showCreateSpaceModal = require('services/CreateSpace').showDialog;

  // stream utils import
  var K = require('utils/kefir');

  // state transition related import
  var $state = require('$state');

  // view template import
  var sidepanelTemplate = require('navigation/Sidepanel.template').default();

  return {
    restrict: 'E',
    template: sidepanelTemplate,
    scope: {},
    replace: true,
    controller: ['$scope', function ($scope) {
      // base data

      // side panel shown
      $scope.sidePanelIsShown = false;
      $scope.toggleSidePanel = function () {
        // check if value in currOrg is equal to the org the
        // current space belongs to. If so, reset currOrg to
        // org of current space as it means user didn't
        // "commit" to the org selected from the dropdown
        var currOrgFromSpaceContext = spaceContext.organizationContext && spaceContext.organizationContext.organization;

        if (spaceContext.organizationContext && ($scope.currOrg.sys.id !== currOrgFromSpaceContext.sys.id)) {
          $scope.currOrg = currOrgFromSpaceContext;
        }

        $scope.sidePanelIsShown = !$scope.sidePanelIsShown;
        $scope.orgDropdownIsShown = false;
      };

      // List of org objects
      $scope.orgs = [];
      K.onValueScope($scope, orgs$, function (orgs) {
        if (orgs) {
          $scope.orgs = orgs;
          if (orgs.length === 1) {
            $scope.currOrg = orgs[0];
          }
        }
      });
      $scope.toggleOrgsDropdown = function () {
        $scope.orgDropdownIsShown = !$scope.orgDropdownIsShown;
      };

      // Object of spaces by org
      // shape: { orgId: [spaceObjects] }
      $scope.spacesByOrg = {};
      K.onValueScope($scope, spacesByOrg$, function (spacesByOrg) {
        $scope.spacesByOrg = spacesByOrg;
      });

      // Org object representing the org current space belongs to
      // This will be switched by choosing a new org from the dropdown
      // and selecting and operation on it like create space.
      // If no operation is performed, it is reverted back to previously
      // selected org
      $scope.$watch(function () {
        return spaceContext.organizationContext && spaceContext.organizationContext.organization;
      }, function (org) {
        if (org) {
          $scope.currOrg = org;
        } else {
          $scope.currOrg = $scope.orgs && $scope.orgs[0];
        }
      });

      // this is separated from the watcher above as currOrg
      // can be changed by user action as well
      $scope.$watch(function () {
        return $scope.currOrg;
      }, function (org) {
        if (org) {
          var orgId = org.sys.id;

          $scope.selectedOrgId = orgId;
          $scope.canGotoOrgSettings = isOwnerOrAdmin(org);

          // shape needed for cf-sref
          $scope.organizationRef = {
            path: ['account', 'organizations', 'subscription'],
            params: {
              orgId: org.sys.id
            },
            options: { reload: true }
          };

          $scope.canCreateSpaceInCurrOrg = canCreateSpaceInOrg(orgId);
          $scope.twoLetterOrgName = org.name.slice(0, 2).toUpperCase();
        }
      });
      $scope.setAndGotoOrg = function (org) {
        $scope.currOrg = org;
      };
      $scope.gotoOrgSettings = function () {
        $scope.toggleSidePanel();
        $state.go('account.organizations.subscription', {
          orgId: $scope.currOrg.sys.id
        }, true);
      };
      $scope.createNewOrg = function () {
        $scope.toggleSidePanel();
        $state.go('account.organizations.new');
      };

      $scope.currSpace = spaceContext.space && spaceContext.space.data;
      $scope.$watch(function () {
        return spaceContext.space && spaceContext.space.data;
      }, function (space) {
        if (space) {
          $scope.currSpace = space;
        }
      });
      $scope.setAndGotoSpace = function (space) {
        $scope.currSpace = space;
        $scope.toggleSidePanel();
        $state.go('spaces.detail.home', { spaceId: space.sys.id });
      };

      // Supported actions
      // select org
      // create org
      // create space
      // goto org settings

      // createOrg
      // TODO: this should be a ui-sref or cf-sref that takes the user to
      // https://app.contentful.com/account/organizations/new

      $scope.selectOrgById = function (orgId) {
        var selectedOrg = _.find($scope.orgs, function (org) {
          return org.sys.id === orgId;
        });

        if (selectedOrg) {
          $scope.currOrg = selectedOrg;
        } else {
          // handle invalid org
        }
      };

      // show space creation modal
      $scope.showCreateSpaceModal = function (orgId) {
        $scope.toggleSidePanel();
        showCreateSpaceModal(orgId);
      };

      // flag that says if user can view org settings
      // $scope.canGotoOrgSettings = isOwnerOrAdmin($scope.currOrg);
      // TODO: Add a watcher that updates the flag above when
      // currOrg changes
      // $scope.watch()

      // TODO: add a watcher that updates this when current org changes
      // $scope.canCreateSpaceInCurrOrg = canCreateSpaceInOrg(currOrg.sys.id);
    }]
  };
}]);
