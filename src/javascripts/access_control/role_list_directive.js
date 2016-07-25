'use strict';

angular.module('contentful').directive('cfRoleList', function () {
  return {
    restrict: 'E',
    template: JST['role_list'](),
    controller: 'RoleListController'
  };
});

angular.module('contentful').controller('RoleListController', ['$scope', '$injector', function ($scope, $injector) {

  var $state = $injector.get('$state');
  var ReloadNotification = $injector.get('ReloadNotification');
  var listHandler = $injector.get('UserListHandler').create();
  var createRoleRemover = $injector.get('createRoleRemover');
  var accessChecker = $injector.get('accessChecker');
  var jumpToRoleMembers = $injector.get('UserListController/jumpToRole');
  var spaceContext = $injector.get('spaceContext');

  $scope.duplicateRole = duplicateRole;
  $scope.jumpToRoleMembers = jumpToRoleMembers;
  $scope.jumpToAdminRoleMembers = jumpToAdminRoleMembers;
  $scope.canModifyRoles = canModifyRoles;

  reload().catch(ReloadNotification.basicErrorHandler);

  function jumpToAdminRoleMembers () {
    jumpToRoleMembers(listHandler.getAdminRoleId());
  }

  function canModifyRoles () {
    var subscription = spaceContext.subscription;
    var trialLockdown = subscription &&
      subscription.isTrial() && subscription.hasTrialEnded();
    return accessChecker.canModifyRoles() && !trialLockdown;
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
