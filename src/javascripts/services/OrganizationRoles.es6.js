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

function createRoleChecker(role) {
  return function checkRole(organization) {
    const id = get(organization, 'sys.id');
    const memberships = get(currentUser, 'organizationMemberships', []);
    const found = find(memberships, { organization: { sys: { id: id } } });
    return role === get(found, 'role');
  };
}
