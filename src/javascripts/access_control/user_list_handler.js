'use strict';

angular.module('contentful')
.factory('UserListHandler', ['require', function (require) {
  var $q = require('$q');
  var spaceContext = require('spaceContext');
  var RoleRepository = require('RoleRepository');
  var SpaceMembershipRepository = require('SpaceMembershipRepository');

  var ADMIN_ROLE_ID = '__cf_builtin_admin';
  var ADMIN_ROLE_NAME = 'Administrator';
  var ADMIN_OPT = { id: ADMIN_ROLE_ID, name: ADMIN_ROLE_NAME };
  var UNKNOWN_ROLE_NAME = 'Unknown';
  var NOT_DEFINED_USER_NAME = 'Name not defined';

  return { create: create };

  function create () {
    var membershipCounts = {};
    var users = [];
    var adminMap = {};
    var membershipMap = {};
    var roleNameMap = {};
    var userRolesMap = {};

    return {
      reset: reset,
      getMembershipCounts: function () { return membershipCounts; },
      getUserCount: function () { return users.length; },
      getGroupedUsers: getGroupedUsers,
      getUsersByRole: getUsersByRole,
      getRoleOptions: getRoleOptions,
      getRoleOptionsBut: getRoleOptionsBut,
      isLastAdmin: isLastAdmin,
      isAdminRole: isAdminRole,
      getAdminRoleId: _.constant(ADMIN_ROLE_ID)
    };

    function reset () {
      return $q.all({
        memberships: SpaceMembershipRepository.getInstance(spaceContext.space).getAll(),
        roles: RoleRepository.getInstance(spaceContext.space).getAll(),
        users: getUsers()
      }).then(processData);
    }

    function processData (data) {
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

      membershipCounts = countMemberships(data.memberships || []);
      users = prepareUsers(data.users || []);

      return data;
    }

    function countMemberships (memberships) {
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

    function prepareUsers (users) {
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
          name: data.firstName && data.lastName ? user.getName() : (data.email || NOT_DEFINED_USER_NAME),
          confirmed: data.activated
        };
      }).sortBy('name').value();
    }

    function getRoleNamesForUser (userId) {
      var roleIds = _.clone(userRolesMap[userId]);
      if (adminMap[userId]) { roleIds.unshift(ADMIN_ROLE_ID); }
      var roleString = _(roleIds).map(getRoleName).value().join(', ');
      return roleString.length > 0 ? roleString : UNKNOWN_ROLE_NAME;
    }

    function getRoleName (id) {
      if (isAdminRole(id)) { return ADMIN_ROLE_NAME; }
      return roleNameMap[id] || UNKNOWN_ROLE_NAME;
    }

    function isAdminRole (id) {
      return id === ADMIN_ROLE_ID;
    }

    function isLastAdmin (userId) {
      var adminCount = _.filter(adminMap, _.identity).length;
      return adminMap[userId] && adminCount < 2;
    }

    function getRoleOptions () {
      return [ADMIN_OPT].concat(_.map(roleNameMap, function (name, id) {
        return { id: id, name: name };
      }));
    }

    function getRoleOptionsBut (roleIdToExclude) {
      return _.filter(getRoleOptions(), function (option) {
        return option.id !== roleIdToExclude;
      });
    }

    function getUsersByRole (id) {
      return _.filter(users, function (user) {
        if (isAdminRole(id)) { return user.isAdmin; }
        return user.roles.indexOf(id) > -1;
      });
    }

    function getGroupedUsers () {
      return {
        name: groupUsersByName(),
        role: groupUsersByRole()
      };
    }

    function groupUsersByName () {
      var byLetter = {};

      _.forEach(users, function (user) {
        var first = user.name.substr(0, 1).toUpperCase();
        byLetter[first] = byLetter[first] || [];
        byLetter[first].push(user);
      });

      var sortedLetters = _.keys(byLetter).sort();

      return _.map(sortedLetters, function (letter) {
        return {
          id: 'letter-group-' + letter.toLowerCase(),
          label: letter,
          users: byLetter[letter]
        };
      });
    }

    function groupUsersByRole () {
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
        return {
          id: 'role-group-' + roleId,
          label: getRoleName(roleId),
          users: byRole[roleId]
        };
      });
    }
  }

  function getUsers () {
    return spaceContext.space.getUsers()
    .then(function (users) {
      return _.uniqBy(users, function (user) {
        return user.data.sys.id;
      });
    });
  }
}]);
