'use strict';

angular.module('contentful')
.directive('cfNavSidePanel', ['require', function (require) {
  var canCreateSpaceInOrg = require('accessChecker').canCreateSpaceInOrganization;

  var tokenStore = require('services/TokenStore');
  var spacesByOrg$ = tokenStore.spacesByOrganization$;
  var orgs$ = tokenStore.organizations$;

  var orgRoles = require('services/OrganizationRoles');
  var isOwnerOrAdmin = orgRoles.isOwnerOrAdmin;

  var spaceContext = require('spaceContext');

  var showCreateSpaceModal = require('services/CreateSpace').showDialog;

  var TheAccountView = require('TheAccountView');

  var K = require('utils/kefir');

  var sidepanelTemplate = require('navigation/Sidepanel.template').default();

  var $state = require('$state');

  return {
    restrict: 'E',
    template: sidepanelTemplate,
    scope: {},
    controller: ['$scope', function ($scope) {
      // base data

      // side panel shown
      $scope.sidePanelIsShown = false;
      $scope.toggleSidePanel = function () {
        $scope.sidePanelIsShown = !$scope.sidePanelIsShown;
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
          $scope.organizationRef = {
            path: ['account', 'organizations', 'subscription'],
            params: {
              orgId: org.sys.id
            },
            options: { reload: true }
          };
          $scope.canCreateSpaceInCurrOrg = canCreateSpaceInOrg(orgId);
        }
      });

      $scope.sp = spaceContext;

      $scope.currSpace = spaceContext.space && spaceContext.space.data;
      $scope.$watch(function () {
        return spaceContext.space && spaceContext.space.data;
      }, function (space) {
        $scope.currSpace = space;
      });
      $scope.setAndGotoSpace = function (space) {
        $scope.currSpace = space;
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
      $scope.showCreateSpaceModal = showCreateSpaceModal;

      // flag that says if user can view org settings
      // $scope.canGotoOrgSettings = isOwnerOrAdmin($scope.currOrg);
      // TODO: Add a watcher that updates the flag above when
      // currOrg changes
      // $scope.watch()

      // TODO: add a watcher that updates this when current org changes
      // $scope.canCreateSpaceInCurrOrg = canCreateSpaceInOrg(currOrg.sys.id);

      // organization settings page should use cf-sref
      $scope.$watch(function () {
        return TheAccountView.getOrganizationRef();
      }, function (ref) {
        $scope.selectedOrgId = ref && ref.params.orgId;
        $scope.organizationRef = ref;
      }, true);

    }]
  };
}]);
