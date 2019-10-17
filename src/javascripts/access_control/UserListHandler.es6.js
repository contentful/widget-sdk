import _ from 'lodash';

import { create as createMembershipRepo } from 'access_control/SpaceMembershipRepository.es6';
import createSpaceMembersRepo from 'data/CMA/SpaceMembersRepo.es6';

import { getModule } from '../NgRegistry.es6';
import RoleRepository from './RoleRepository.es6';
import { ADMIN_ROLE_ID } from './constants.es6';
import { getAllUsers } from './OrganizationMembershipRepository.es6';

const ADMIN_ROLE_NAME = 'Administrator';
const ADMIN_OPT = { id: ADMIN_ROLE_ID, name: ADMIN_ROLE_NAME };
const UNKNOWN_ROLE_NAME = 'Unknown';
const NOT_DEFINED_USER_NAME = 'Name not defined';

export function create() {
  const spaceContext = getModule('spaceContext');

  let membershipCounts = {};
  let users = [];
  let adminMap = {};
  let membershipMap = {};
  let roleNameMap = {};
  let userRolesMap = {};
  let spaceMembershipMap = {};

  return {
    reset,
    getMembershipCounts: function() {
      return membershipCounts;
    },
    getUserCount: function() {
      return users.length;
    },
    getUserIds: function() {
      return users.map(user => user.id);
    },
    getGroupedUsers,
    getUsersByRole,
    getRoleOptions,
    getRoleOptionsBut,
    isLastAdmin
  };

  function reset() {
    const { endpoint, space } = spaceContext;
    return Promise.all([
      createSpaceMembersRepo(endpoint).getAll(),
      createMembershipRepo(endpoint).getAll(),
      RoleRepository.getInstance(space).getAll(),
      getAllUsers(endpoint)
    ]).then(([memberships, spaceMemberships, roles, users]) =>
      processData({
        memberships,
        spaceMemberships,
        roles,
        users
      })
    );
  }

  function processData(data) {
    adminMap = {};
    membershipMap = {};
    spaceMembershipMap = {};
    roleNameMap = {};
    userRolesMap = {};

    _.forEach(data.memberships, membership => {
      const userId = membership.sys.user.sys.id;
      adminMap[userId] = membership.admin;
      membershipMap[userId] = membership;

      userRolesMap[userId] = userRolesMap[userId] || [];
      _.forEach(membership.roles, role => {
        userRolesMap[userId].push(role.sys.id);
      });
    });

    _.forEach(data.spaceMemberships, membership => {
      const userId = membership.user.sys.id;
      spaceMembershipMap[userId] = membership;
    });

    _.forEach(data.roles, role => {
      roleNameMap[role.sys.id] = role.name;
    });

    membershipCounts = countMemberships(data.memberships || []);
    users = prepareUsers(data.users || []);

    return data;
  }

  function countMemberships(memberships) {
    const counts = { admin: 0 };

    _.forEach(memberships, item => {
      if (item.admin) {
        counts.admin += 1;
      }
      _.forEach(item.roles || [], role => {
        counts[role.sys.id] = counts[role.sys.id] || 0;
        counts[role.sys.id] += 1;
      });
    });

    return counts;
  }

  function prepareUsers(users) {
    return _(users)
      .map(user => {
        const id = user.sys.id;
        // This is a hack while we work on the new Users page.
        const numberOfTeamMemberships = membershipMap[id].relatedMemberships.filter(
          ({ sys: { linkType } }) => linkType === 'TeamSpaceMembership'
        ).length;

        return {
          id,
          membership: membershipMap[id],
          spaceMembership: spaceMembershipMap[id],
          isAdmin: adminMap[id],
          roles: userRolesMap[id] || [],
          roleNames: getRoleNamesForUser(id),
          avatarUrl: user.avatarUrl,
          numberOfTeamMemberships,
          name:
            user.firstName && user.lastName ? getName(user) : user.email || NOT_DEFINED_USER_NAME,
          confirmed: user.activated
        };
      })
      .sortBy('name')
      .value();
  }

  function getName(user) {
    return user.firstName + ' ' + user.lastName;
  }

  function getRoleNamesForUser(userId) {
    const roleIds = _.clone(userRolesMap[userId]);
    if (adminMap[userId]) {
      roleIds.unshift(ADMIN_ROLE_ID);
    }
    const roleString = _(roleIds)
      .map(getRoleName)
      .value()
      .join(', ');
    return roleString.length > 0 ? roleString : UNKNOWN_ROLE_NAME;
  }

  function getRoleName(id) {
    if (isAdminRole(id)) {
      return ADMIN_ROLE_NAME;
    }
    return roleNameMap[id] || UNKNOWN_ROLE_NAME;
  }

  function isAdminRole(id) {
    return id === ADMIN_ROLE_ID;
  }

  function isLastAdmin(userId) {
    const adminCount = _.filter(adminMap, _.identity).length;
    return adminMap[userId] && adminCount < 2;
  }

  function getRoleOptions() {
    return [ADMIN_OPT].concat(
      _.map(roleNameMap, (name, id) => ({
        id,
        name
      }))
    );
  }

  function getRoleOptionsBut(roleIdToExclude) {
    return _.filter(getRoleOptions(), option => option.id !== roleIdToExclude);
  }

  function getUsersByRole(id) {
    return _.filter(users, user => {
      if (isAdminRole(id)) {
        return user.isAdmin;
      }
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
    const byLetter = {};

    _.forEach(users, user => {
      const first = user.name.substr(0, 1).toUpperCase();
      byLetter[first] = byLetter[first] || [];
      byLetter[first].push(user);
    });

    const sortedLetters = _.keys(byLetter).sort();

    return _.map(sortedLetters, letter => ({
      id: 'letter-group-' + letter.toLowerCase(),
      label: letter,
      users: byLetter[letter]
    }));
  }

  function groupUsersByRole() {
    const byRole = {};
    const admins = [];

    _.forEach(users, user => {
      if (user.isAdmin) {
        admins.push(user);
      }
      _.forEach(user.roles, roleId => {
        byRole[roleId] = byRole[roleId] || [];
        byRole[roleId].push(user);
      });
    });

    const sortedRoleIds = _(byRole)
      .keys()
      .sortBy(getRoleName)
      .value();
    sortedRoleIds.unshift(ADMIN_ROLE_ID);
    byRole[ADMIN_ROLE_ID] = admins;

    return _.map(sortedRoleIds, roleId => ({
      id: 'role-group-' + roleId,
      label: getRoleName(roleId),
      users: byRole[roleId]
    }));
  }
}
