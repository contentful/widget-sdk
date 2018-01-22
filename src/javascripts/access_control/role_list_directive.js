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
  var ReloadNotification = require('ReloadNotification');
  var listHandler = require('UserListHandler').create();
  var createRoleRemover = require('createRoleRemover');
  var accessChecker = require('access_control/AccessChecker');
  var jumpToRoleMembers = require('UserListController/jumpToRole');
  var spaceContext = require('spaceContext');
  var ADMIN_ROLE_ID = require('access_control/SpaceMembershipRepository').ADMIN_ROLE_ID;

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

  function checkIfCanModifyRoles () {
    var subscription = spaceContext.subscription;
    var trialLockdown = subscription &&
      subscription.isTrial() && subscription.hasTrialEnded();
    if (trialLockdown) { return Promise.resolve(false); } else { return accessChecker.canModifyRoles(); }
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
