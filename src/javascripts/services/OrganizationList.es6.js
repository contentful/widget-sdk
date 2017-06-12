/**
 * @ngdoc service
 * @name OrganizationList
 *
 * @description
 * This service keeps global state of organizations.
 * It exposes multiple utility getter methods.
 */
import { filter, map, get, find } from 'lodash';

let currentUser = null;
let organizations = [];

/**
 * @ngdoc method
 * @name OrganizationList#isAdmin
 * @param {object} organization
 * @returns {boolean}
 * @description
 * Checks if user is an admin of a given organization.
 */
export const isAdmin = createRoleChecker('admin');

/**
 * @ngdoc method
 * @name OrganizationList#isOwner
 * @param {object} organization
 * @returns {boolean}
 * @description
 * Checks if user is an owner of a given organization.
 */
export const isOwner = createRoleChecker('owner');

/**
 * @ngdoc method
 * @name OrganizationList#resetWithUser
 * @param {API.User} user
 * @description
 * Gets user object and initializes list with organizations.
 */
export function resetWithUser (user) {
  currentUser = user;
  organizations = map(user.organizationMemberships, 'organization');
}

/**
 * @ngdoc method
 * @name OrganizationList#isEmpty
 * @returns {boolean}
 * @description
 * Returns true if there are no organizations, false otherwise.
 */
export function isEmpty () {
  return organizations.length === 0;
}

export { getOrganization as get };
/**
 * @ngdoc method
 * @name OrganizationList#get
 * @param {string} id
 * @returns {object|null}
 * @description
 * Gets organization by the provided ID.
 */
function getOrganization (id) {
  const result = filter(organizations, { sys: { id: id } });
  return result.length > 0 ? result[0] : null;
}

/**
 * @ngdoc method
 * @name OrganizationList#getAll
 * @returns {object[]}
 * @description
 * Gets all organizations as an array.
 */
export function getAll () {
  return organizations;
}

/**
 * @ngdoc method
 * @name OrganizationList#isOwnerOrAdmin
 * @param {object} organization
 * @description
 * Checks if the user is an owner or admin of the organization with the given ID.
 */
export function isOwnerOrAdmin (organization) {
  return isOwner(organization) || isAdmin(organization);
}


function createRoleChecker (role) {
  return function checkRole (organization) {
    const id = get(organization, 'sys.id');
    const memberships = get(currentUser, 'organizationMemberships', []);
    const found = find(memberships, {organization: {sys: {id: id}}});
    return role === get(found, 'role');
  };
}
