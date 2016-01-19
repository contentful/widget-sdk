'use strict';

angular.module('contentful').directive('cfRoleList', function () {
  return {
    restrict: 'E',
    template: JST['role_list'](),
    controller: 'RoleListController'
  };
});

angular.module('contentful').controller('RoleListController', ['$scope', '$injector', function ($scope, $injector) {

  var $q                  = $injector.get('$q');
  var $state              = $injector.get('$state');
  var ReloadNotification  = $injector.get('ReloadNotification');
  var space               = $injector.get('spaceContext').space;
  var roleRepo            = $injector.get('RoleRepository').getInstance(space);
  var spaceMembershipRepo = $injector.get('SpaceMembershipRepository').getInstance(space);
  var listHandler         = $injector.get('UserListHandler').create();
  var createRoleRemover   = $injector.get('createRoleRemover');
  var accessChecker       = $injector.get('accessChecker');
  var TrialWatcher        = $injector.get('TrialWatcher');
  var jumpToRoleMembers   = $injector.get('UserListController/jumpToRole');

  $scope.removeRole             = _.noop;
  $scope.duplicateRole          = duplicateRole;
  $scope.jumpToRoleMembers      = jumpToRoleMembers;
  $scope.jumpToAdminRoleMembers = jumpToAdminRoleMembers;
  $scope.canModifyRoles         = canModifyRoles;

  reload().catch(ReloadNotification.basicErrorHandler);

  function jumpToAdminRoleMembers() {
    jumpToRoleMembers(listHandler.getAdminRoleId());
  }

  function canModifyRoles() {
    return accessChecker.canModifyRoles() && !TrialWatcher.hasEnded();
  }

  function duplicateRole(role) {
    $state.go('spaces.detail.settings.roles.new', {baseRoleId: role.sys.id});
  }

  function reload() {
    return $q.all({
      memberships: spaceMembershipRepo.getAll(),
      roles: roleRepo.getAll(),
      users: space.getUsers()
    }).then(function (data) {
      $scope.roles = _.sortBy(data.roles, 'name');
      listHandler.reset(data);
      $scope.memberships = listHandler.getMembershipCounts();
      $scope.removeRole = createRoleRemover(listHandler, reload);
      $scope.context.ready = true;
    }, accessChecker.wasForbidden($scope.context));
  }
}]);
