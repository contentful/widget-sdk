'use strict';

angular.module('contentful').directive('cfRoleList', function () {
  return {
    restrict: 'E',
    template: JST['role_list'](),
    controller: 'RoleListController'
  };
});

angular.module('contentful').controller('RoleListController', ['$scope', 'require', function ($scope, require) {
  var $state = require('$state');
  var $q = require('$q');
  var ReloadNotification = require('ReloadNotification');
  var listHandler = require('UserListHandler').create();
  var createRoleRemover = require('createRoleRemover');
  var accessChecker = require('access_control/AccessChecker');
  var jumpToRoleMembers = require('UserListController/jumpToRole');
  var spaceContext = require('spaceContext');
  var ADMIN_ROLE_ID = require('access_control/SpaceMembershipRepository').ADMIN_ROLE_ID;
  var ResourceUtils = require('utils/ResourceUtils');
  var TheAccountView = require('TheAccountView');
  var isOwnerOrAdmin = require('services/OrganizationRoles').isOwnerOrAdmin;
  var AccessChecker = require('access_control/AccessChecker');

  var org = spaceContext.organizationContext.organization;

  $q.all({
    canModifyRoles: AccessChecker.canModifyRoles(),
    useLegacy: ResourceUtils.useLegacy(org)
  }).then(function (result) {
    var subscription = spaceContext.subscription;
    var trialLockdown = subscription.isTrial() && subscription.hasTrialEnded();

    $scope.legacy = result.useLegacy;
    $scope.hasFeatureEnabled = !trialLockdown && result.canModifyRoles;
  }).then(reload).catch(ReloadNotification.basicErrorHandler);

  $scope.duplicateRole = duplicateRole;
  $scope.jumpToRoleMembers = jumpToRoleMembers;
  $scope.jumpToAdminRoleMembers = jumpToAdminRoleMembers;
  $scope.accountUpgradeState = TheAccountView.getSubscriptionState();
  $scope.canUpgrade = isOwnerOrAdmin(org);

  function jumpToAdminRoleMembers () {
    jumpToRoleMembers(ADMIN_ROLE_ID);
  }

  function duplicateRole (role) {
    $state.go('spaces.detail.settings.roles.new', {baseRoleId: role.sys.id});
  }

  function reload () {
    return listHandler.reset()
    .then(onResetResponse, accessChecker.wasForbidden($scope.context));
  }

  function onResetResponse (data) {
    $scope.memberships = listHandler.getMembershipCounts();
    $scope.countAdmin = $scope.memberships.admin || 0;

    $scope.roles = _.sortBy(data.roles, 'name').map(function (role) {
      role.count = $scope.memberships[role.sys.id] || 0;

      return role;
    });
    $scope.removeRole = createRoleRemover(listHandler, reload);
    $scope.context.ready = true;
    $scope.usage = data.rolesResource.usage;
    $scope.limit = ResourceUtils.getResourceLimits(data.rolesResource).maximum;
    $scope.reachedLimit = !ResourceUtils.canCreate(data.rolesResource);
  }
}]);
