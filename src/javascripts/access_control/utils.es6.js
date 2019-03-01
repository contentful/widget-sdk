import { ADMIN_ROLE } from './constants.es6';

export function getMembershipRoles(membership) {
  if (membership.admin) {
    return [ADMIN_ROLE];
  } else {
    return membership.roles;
  }
}
