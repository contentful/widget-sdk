import { ADMIN_ROLE } from './constants.es6';

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
