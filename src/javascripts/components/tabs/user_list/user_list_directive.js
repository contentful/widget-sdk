'use strict';

angular.module('contentful').directive('cfUserList', function () {
  return {
    restrict: 'E',
    template: JST['user_list'](),
    controller: 'UserListController'
  };
});

angular.module('contentful').controller('UserListController', ['$scope', '$injector', function ($scope, $injector) {

  var ReloadNotification  = $injector.get('ReloadNotification');
  var space               = $injector.get('spaceContext').space;
  var $q                  = $injector.get('$q');
  var modalDialog         = $injector.get('modalDialog');
  var roleRepo            = $injector.get('RoleRepository').getInstance(space);
  var spaceMembershipRepo = $injector.get('SpaceMembershipRepository').getInstance(space);

  var adminMap;
  var membershipMap;
  var roleNameMap;
  var userRolesMap;

  var ADMIN_ROLE_ID = '__cf_builtin_admin';

  reload();

  $scope.selectedListView = 'name';
  $scope.removeFromSpace = function (userId) {
    var adminCount = _.filter(adminMap, _.identity).length;
    var isLastAdmin = adminMap[userId] && adminCount < 2;

    if (!isLastAdmin) {
      remove();
      return;
    }

    modalDialog.openConfirmDeleteDialog({
      title: 'Removing last admin',
      message: 'Are you sure?',
      confirmLabel: 'Remove'
    }).promise.then(remove);

    function remove() {
      return spaceMembershipRepo.remove(membershipMap[userId]).then(reload);
    }
  };

  function reload() {
    return $q.all({
      memberships: spaceMembershipRepo.getAll(),
      roles: roleRepo.getAll(),
      users: space.getUsers()
    }).then(function (data) {
      prepareMaps(data.memberships, data.roles);
      $scope.users = prepareUsers(data.users);
      $scope.by = groupUsers();
      $scope.context.ready = true;
    })
    .catch(ReloadNotification.apiErrorHandler)
    .catch(function () { ReloadNotification.trigger(); });
  }

  function prepareUsers(users) {
    return _(users).map(function (user) {
      var data = user.data;
      var id = user.getId();

      return {
        id: id,
        avatarUrl: data.avatarUrl,
        name: data.firstName && data.lastName ? user.getName() : 'Name not defined',
        roles: userRolesMap[id],
        roleNames: getRoleNamesForUser(id),
        isAdmin: adminMap[id]
      };
    }).sortBy('name').value();
  }

  function getRoleNamesForUser(userId) {
    var roleIds = _.clone(userRolesMap[userId]);
    if (adminMap[userId]) { roleIds.unshift(ADMIN_ROLE_ID); }
    var roleString = _(roleIds).map(getRoleName).value().join(', ');
    return roleString.length > 0 ? roleString: 'None';
  }

  function getRoleName(id) {
    if (id === ADMIN_ROLE_ID) { return 'Administrator'; }
    return roleNameMap[id] || 'Unknown';
  }

  function prepareMaps(memberships, roles) {
    adminMap = {};
    membershipMap = {};
    roleNameMap = {};
    userRolesMap = {};

    _.forEach(memberships, function (membership) {
      adminMap[membership.user.sys.id] = membership.admin;
      membershipMap[membership.user.sys.id] = membership.sys.id;
    });

    _.forEach(roles, function (role) {
      roleNameMap[role.sys.id] = role.name;
    });

    _.forEach(memberships, function (membership) {
      var userId = membership.user.sys.id;
      if (!userRolesMap[userId]) { userRolesMap[userId] = []; }
      _.forEach(membership.roles, function (role) {
        userRolesMap[userId].push(role.sys.id);
      });
    });
  }

  function groupUsers() {
    return {
      name: groupUsersByName(),
      role: groupUsersByRole()
    };
  }

  function groupUsersByName() {
    var byLetter = {};

    _.forEach($scope.users, function (user) {
      var first = user.name.substr(0, 1).toUpperCase();
      byLetter[first] = byLetter[first] || [];
      byLetter[first].push(user);
    });

    var sortedLetters = _.keys(byLetter).sort();

    return _.map(sortedLetters, function (letter) {
      return { label: letter, users: byLetter[letter ]};
    });
  }

  function groupUsersByRole() {
    var byRole = {};
    var admins = [];

    _.forEach($scope.users, function (user) {
      if (user.isAdmin) { admins.push(user); }
      _.forEach(user.roles, function (roleId) {
        byRole[roleId] = byRole[roleId] || [];
        byRole[roleId].push(user);
      });
    });

    var sortedRoleIds = _(byRole).keys().sortBy(getRoleName).value();
    sortedRoleIds.unshift(ADMIN_ROLE_ID);
    byRole[ADMIN_ROLE_ID] = admins;

    return _.map(sortedRoleIds, function (roleId) {
      return { label: getRoleName(roleId), users: byRole[roleId] };
    });
  }
}]);
