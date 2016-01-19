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
  var RoleActions         = $injector.get('RoleActions');
  var accessChecker       = $injector.get('accessChecker');
  var TrialWatcher        = $injector.get('TrialWatcher');

  $scope.removeRole             = RoleActions.removeRole;
  $scope.jumpToRoleMembers      = RoleActions.jumpToRoleMembers;
  $scope.jumpToAdminRoleMembers = RoleActions.jumpToAdminRoleMembers;
  $scope.canModifyRoles         = canModifyRoles;
  $scope.duplicateRole          = duplicateRole;

  function canModifyRoles() {
    return accessChecker.canModifyRoles() && !TrialWatcher.hasEnded();
  }

  function duplicateRole(role) {
    $state.go('spaces.detail.settings.roles.new', {baseRoleId: role.sys.id});
  }

  reload().catch(ReloadNotification.basicErrorHandler);

  function reload() {
    return $q.all({
      memberships: spaceMembershipRepo.getAll(),
      roles: roleRepo.getAll(),
      users: space.getUsers()
    }).then(function (data) {
      $scope.memberships = countMemberships(data.memberships);
      $scope.roles = _.sortBy(data.roles, 'name');

      RoleActions.reset({
        roleRepo: roleRepo,
        spaceMembershipRepo: spaceMembershipRepo,
        membershipCounts: $scope.memberships,
        data: data,
        reload: reload
      });

      $scope.context.ready = true;
    }, accessChecker.wasForbidden($scope.context));
  }

  function countMemberships(memberships) {
    var counts = { admin: 0 };

    _.forEach(memberships, function (item) {
      if (item.admin) { counts.admin += 1; }
      _.forEach(item.roles || [], function (role) {
        counts[role.sys.id] = counts[role.sys.id] || 0;
        counts[role.sys.id] += 1;
      });
    });

    return counts;
  }
}]);
