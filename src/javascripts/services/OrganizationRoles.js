/**
 * @ngdoc service
 * @name OrganizationRoles
 *
 * @description
 * This service keeps global state of organizations.
 * It exposes multiple utility getter methods.
 */
import { get, find } from 'lodash';

let currentUser = null;

/**
 * @ngdoc method
 * @name OrganizationRoles#isAdmin
 * @param {object} organization
 * @returns {boolean}
 * @description
 * Checks if user is an admin of a given organization.
 */
export const isAdmin = createRoleChecker('admin');

/**
 * @ngdoc method
 * @name OrganizationRoles#isOwner
 * @param {object} organization
 * @returns {boolean}
 * @description
 * Checks if user is an owner of a given organization.
 */
export const isOwner = createRoleChecker('owner');

/**
 * @ngdoc method
 * @name OrganizationRoles#isDeveloper
 * @param {object} organization
 * @returns {boolean}
 * @description
 * Checks if user is a developer in a given organization.
 */
export const isDeveloper = createRoleChecker('developer');

/**
 * @ngdoc method
 * @name OrganizationRoles#setUser
 * @param {API.User} user
 */
export function setUser(user) {
  currentUser = user;
}

/**
 * @ngdoc method
 * @name OrganizationRoles#isOwnerOrAdmin
 * @param {object} organization
 * @description
 * Checks if the user is an owner or admin of the organization with the given ID.
 */
export function isOwnerOrAdmin(organization) {
  return isOwner(organization) || isAdmin(organization);
}

/**
 * @ngdoc method
 * @name OrganizationRoles#hasMemberRole
 * @param {object} organization
 * @description
 * Checks if the user's role is 'member' of the organization with the given ID.
 */
export const hasMemberRole = createRoleChecker('member');

/**
 * @ngdoc method
 * @name OrganizationRoles#getOrganizationMembership
 * @param {number} organizationId
 * @description
 * Returns the current user's organization membership given the organization's ID.
 */
export function getOrganizationMembership(organizationId) {
  const memberships = get(currentUser, 'organizationMemberships', []);
  const found = find(memberships, { organization: { sys: { id: organizationId } } });
  if (!found) {
    throw Error(
      `Cannot find organization membership of current user with organization id: ${organizationId}`
    );
  }

  return found;
}

function createRoleChecker(role) {
  return function checkRole(organization) {
    const id = get(organization, 'sys.id');
    const memberships = get(currentUser, 'organizationMemberships', []);
    const found = find(memberships, { organization: { sys: { id } } });
    return role === get(found, 'role');
  };
}
