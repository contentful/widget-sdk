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
  var createResourceService = require('services/ResourceService').default;
  var ResourceUtils = require('utils/ResourceUtils');

  var org = spaceContext.organizationContext.organization;

  function checkIfCanModifyRoles () {
    var subscription = spaceContext.subscription;
    var trialLockdown = subscription &&
    subscription.isTrial() && subscription.hasTrialEnded();
    if (trialLockdown) { return Promise.resolve(false); } else { return accessChecker.canModifyRoles(); }
  }

  $q.all({
    canModifyRoles: accessChecker.canModifyRoles(),
    resource: createResourceService(spaceContext.getId()).get('role'),
    useLegacy: ResourceUtils.useLegacy(org)
  }).then(function (result) {
    var subscription = spaceContext.subscription;
    var isTrial = subscription.isTrial();
    var trialLockdown = isTrial && subscription.hasTrialEnded();
    var canCreate = ResourceUtils.canCreate(result.resource);

    $scope.resourceContext = result.useLegacy ? 'organization' : 'space';
    $scope.usage = result.resource.usage;
    $scope.limit = result.resource.limits.maximum;
    $scope.reachedLimit = !canCreate;
    $scope.canModifyRoles = !trialLockdown && result.canModifyRoles;
  });

  checkIfCanModifyRoles().then(function (value) {
    $scope.canModifyRoles = value;
  });

  $scope.duplicateRole = duplicateRole;
  $scope.jumpToRoleMembers = jumpToRoleMembers;
  $scope.jumpToAdminRoleMembers = jumpToAdminRoleMembers;

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
  }
}]);
