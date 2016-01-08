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
  var ReloadNotification  = $injector.get('ReloadNotification');
  var space               = $injector.get('spaceContext').space;
  var roleRepo            = $injector.get('RoleRepository').getInstance(space);
  var spaceMembershipRepo = $injector.get('SpaceMembershipRepository').getInstance(space);
  var RoleActions         = $injector.get('RoleActions');
  var accessChecker       = $injector.get('accessChecker');
  var TheAccountView      = $injector.get('TheAccountView');

  $scope.removeRole             = RoleActions.removeRole;
  $scope.duplicateRole          = RoleActions.duplicateRole;
  $scope.jumpToRoleMembers      = RoleActions.jumpToRoleMembers;
  $scope.jumpToAdminRoleMembers = RoleActions.jumpToAdminRoleMembers;
  $scope.canModifyRoles         = accessChecker.canModifyRoles;
  $scope.goToSubscription       = TheAccountView.goToSubscription;

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
