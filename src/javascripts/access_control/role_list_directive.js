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

  var org = spaceContext.organizationContext.organization;

  $q.all({
    hasFeatureEnabled: accessChecker.canModifyRoles(),
    useLegacy: ResourceUtils.useLegacy(org)
  }).then(function (result) {
    var subscription = spaceContext.subscription;
    var isTrial = subscription.isTrial();
    var trialLockdown = isTrial && subscription.hasTrialEnded();

    $scope.legacy = result.useLegacy;
    // all v2 spaces have custom roles enabled
    $scope.hasFeatureEnabled = !result.legacy || (!trialLockdown && result.hasFeatureEnabled);
  });

  $scope.duplicateRole = duplicateRole;
  $scope.jumpToRoleMembers = jumpToRoleMembers;
  $scope.jumpToAdminRoleMembers = jumpToAdminRoleMembers;
  $scope.accountUpgradeState = TheAccountView.getSubscriptionState();
  $scope.canUpgrade = isOwnerOrAdmin(org);

  reload().catch(ReloadNotification.basicErrorHandler);

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
    $scope.roles = _.sortBy(data.roles, 'name');
    $scope.memberships = listHandler.getMembershipCounts();
    $scope.removeRole = createRoleRemover(listHandler, reload);
    $scope.context.ready = true;
    $scope.usage = data.rolesResource.usage;
    $scope.limit = data.rolesResource.limits.maximum;
    $scope.reachedLimit = !ResourceUtils.canCreate(data.rolesResource);
  }
}]);
