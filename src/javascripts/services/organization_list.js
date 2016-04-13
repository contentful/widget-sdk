'use strict';

/**
 * @ngdoc service
 * @name OrganizationList
 *
 * @description
 * This service keeps global state of organizations.
 * It exposes multiple utility getter methods.
 */
angular.module('contentful').factory('OrganizationList', function () {

  var currentUser = null;
  var organizations = [];

  return {
    resetWithUser: resetWithUser,
    isEmpty: isEmpty,
    get: get,
    getName: getName,
    getAll: getAll,
    /**
     * @ngdoc method
     * @name OrganizationList#isAdmin
     * @param {string} id
     * @returns {boolean}
     * @description
     * Checks if user is an admin of organization with a given ID.
     */
    isAdmin: createRoleChecker('admin'),
    /**
     * @ngdoc method
     * @name OrganizationList#isOwner
     * @param {string} id
     * @returns {boolean}
     * @description
     * Checks if user is an owner of organization with a given ID.
     */
    isOwner: createRoleChecker('owner')
  };

  /**
   * @ngdoc method
   * @name OrganizationList#resetWithUser
   * @param {API.User} user
   * @description
   * Gets user object and initializes list with organizations.
   */
  function resetWithUser (user) {
    currentUser = user;
    organizations = _.map(user.organizationMemberships, 'organization');
  }

  /**
   * @ngdoc method
   * @name OrganizationList#isEmpty
   * @returns {boolean}
   * @description
   * Returns true if there are no organizations, false otherwise.
   */
  function isEmpty () {
    return organizations.length === 0;
  }

  /**
   * @ngdoc method
   * @name OrganizationList#get
   * @param {string} id
   * @returns {object}
   * @description
   * Gets organization by the provided ID.
   */
  function get (id) {
    var result = _.where(organizations, { sys: { id: id } });
    return result.length > 0 ? result[0] : null;
  }

  /**
   * @ngdoc method
   * @name OrganizationList#getName
   * @param {string} id
   * @returns {string}
   * @description
   * Gets name of organization (by ID).
   */
  function getName (id) {
    var organization = get(id);
    return organization ? organization.name : '';
  }

  /**
   * @ngdoc method
   * @name OrganizationList#getAll
   * @returns {object[]}
   * @description
   * Gets all organizations as an array.
   */
  function getAll () {
    return organizations;
  }

  function createRoleChecker (role) {
    return function checkRole (id) {
      var memberships = dotty.get(currentUser, 'organizationMemberships', []);
      var found = _.findWhere(memberships, {organization: {sys: {id: id}}});
      return role === dotty.get(found, 'role');
    };
  }
});
