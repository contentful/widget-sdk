import { ADMIN_ROLE, ADMIN_ROLE_ID } from './constants.es6';

export function getMembershipRoles(membership) {
  if (membership.admin) {
    return [ADMIN_ROLE];
  } else {
    return membership.roles;
  }
}

export function getSpaceMembershipRoleNames(membership) {
  if (membership.admin) {
    return [ADMIN_ROLE.name];
  } else {
    return membership.roles.map(role => role.name);
  }
}

/**
 *
 * @param {String[]} roleIds A list a role ids, where a fake admin admin could be
 */
export function createSpaceRoleLinks(roleIds = []) {
  const isAdmin = roleIds.includes(ADMIN_ROLE_ID);

  return {
    admin: isAdmin,
    roles: isAdmin ? [] : roleIds.map(id => ({ sys: { type: 'Link', linkType: 'Role', id } }))
  };
}
