'use strict';

angular.module('contentful').directive('cfRoleList', function () {
  return {
    restrict: 'E',
    template: JST['role_list'](),
    controller: 'RoleListController'
  };
});

angular.module('contentful').controller('RoleListController', ['$scope', '$injector', function ($scope, $injector) {

  var ReloadNotification  = $injector.get('ReloadNotification');
  var space               = $injector.get('spaceContext').space;
  var $q                  = $injector.get('$q');
  var modalDialog         = $injector.get('modalDialog');
  var roleRepo            = $injector.get('RoleRepository').getInstance(space);
  var spaceMembershipRepo = $injector.get('SpaceMembershipRepository').getInstance(space);
  var listHandler         = $injector.get('UserListHandler');

  $scope.sref       = createSref;
  $scope.removeRole = removeRole;
  $scope.notImplemented = function () { window.alert('Not implemented yet.'); };

  reload().catch(ReloadNotification.basicErrorHandler);

  function removeRole(role) {
    var count = $scope.memberships[role.sys.id];
    if (!count) {
      remove();
      return;
    }

    modalDialog.open({
      template: 'role_removal_dialog',
      scopeData: {
        role: role,
        input: {},
        count: count,
        roleOptions: listHandler.getRoleOptionsBut(role.sys.id)
      }
    }).promise.then(moveUsersAndRemoveRole);

    function moveUsersAndRemoveRole(moveToRoleId) {
      var users = listHandler.getUsersByRole(role.sys.id);
      var memberships = _.pluck(users, 'membership');
      var method = 'changeRoleTo';
      if (listHandler.isAdminRole(moveToRoleId)) {
        method = 'changeRoleToAdmin';
      }

      var promises = _.map(memberships, function (membership) {
        return spaceMembershipRepo[method](membership, moveToRoleId);
      });

      return $q.all(promises).then(remove, ReloadNotification.basicErrorHandler);
    }

    function remove() {
      return roleRepo.remove(role)
      .then(reload)
      .catch(ReloadNotification.basicErrorHandler);
    }
  }

  function reload() {
    return $q.all({
      memberships: spaceMembershipRepo.getAll(),
      roles: roleRepo.getAll(),
      users: space.getUsers()
    }).then(function (data) {
      $scope.memberships = countMemberships(data.memberships);
      $scope.roles = data.roles;
      listHandler.reset(data);
      $scope.context.ready = true;
    });
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

  function createSref(role, stateName) {
    return 'spaces.detail.settings.roles.' +
      (stateName || 'detail') +
      '({ roleId: \'' + role.sys.id + '\' })';
  }
}]);
