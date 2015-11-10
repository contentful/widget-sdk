'use strict';

angular.module('contentful').factory('UserListHandler', [function () {

  var ADMIN_ROLE_ID          = '__cf_builtin_admin';
  var ADMIN_ROLE_NAME        = 'Administrator';
  var ADMIN_OPT              = { id: ADMIN_ROLE_ID, name: ADMIN_ROLE_NAME };
  var UNKNOWN_ROLE_NAME      = 'Unknown';
  var NOT_DEFINED_USER_NAME  = 'Name not defined';

  var users = [];
  var adminMap = {};
  var membershipMap = {};
  var roleNameMap = {};
  var userRolesMap = {};

  return {
    reset: reset,
    getGroupedUsers: getGroupedUsers,
    getUsersByRole: getUsersByRole,
    getRoleOptions: getRoleOptions,
    getRoleOptionsBut: getRoleOptionsBut,
    isLastAdmin: isLastAdmin,
    isAdminRole: isAdminRole
  };

  function reset(data) {
    adminMap = {};
    membershipMap = {};
    roleNameMap = {};
    userRolesMap = {};

    _.forEach(data.memberships, function (membership) {
      var userId = membership.user.sys.id;
      adminMap[userId] = membership.admin;
      membershipMap[userId] = membership;

      userRolesMap[userId] = userRolesMap[userId] || [];
      _.forEach(membership.roles, function (role) {
        userRolesMap[userId].push(role.sys.id);
      });
    });

    _.forEach(data.roles, function (role) {
      roleNameMap[role.sys.id] = role.name;
    });

    users = prepareUsers(data.users || []);
    return users.length;
  }

  function prepareUsers(users) {
    return _(users).map(function (user) {
      var data = user.data;
      var id = user.getId();

      return {
        id: id,
        membership: membershipMap[id],
        isAdmin: adminMap[id],
        roles: userRolesMap[id] || [],
        roleNames: getRoleNamesForUser(id),
        avatarUrl: data.avatarUrl,
        name: data.firstName && data.lastName ? user.getName() : (data.email || NOT_DEFINED_USER_NAME)
      };
    }).sortBy('name').value();
  }

  function getRoleNamesForUser(userId) {
    var roleIds = _.clone(userRolesMap[userId]);
    if (adminMap[userId]) { roleIds.unshift(ADMIN_ROLE_ID); }
    var roleString = _(roleIds).map(getRoleName).value().join(', ');
    return roleString.length > 0 ? roleString : UNKNOWN_ROLE_NAME;
  }

  function getRoleName(id) {
    if (isAdminRole(id)) { return ADMIN_ROLE_NAME; }
    return roleNameMap[id] || UNKNOWN_ROLE_NAME;
  }

  function isAdminRole(id) {
    return id === ADMIN_ROLE_ID;
  }

  function isLastAdmin(userId) {
    var adminCount = _.filter(adminMap, _.identity).length;
    return adminMap[userId] && adminCount < 2;
  }

  function getRoleOptions() {
    return [ADMIN_OPT].concat(_.map(roleNameMap, function (name, id) {
      return { id: id, name: name };
    }));
  }

  function getRoleOptionsBut(roleIdToExclude) {
    return _.filter(getRoleOptions(), function (option) {
      return option.id !== roleIdToExclude;
    });
  }

  function getUsersByRole(id) {
    return _.filter(users, function (user) {
      if (isAdminRole(id)) { return user.isAdmin; }
      return user.roles.indexOf(id) > -1;
    });
  }

  function getGroupedUsers() {
    return {
      name: groupUsersByName(),
      role: groupUsersByRole()
    };
  }

  function groupUsersByName() {
    var byLetter = {};

    _.forEach(users, function (user) {
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

    _.forEach(users, function (user) {
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
