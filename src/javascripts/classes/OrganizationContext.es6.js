import { createOrganizationEndpoint } from 'data/Endpoint';
import { fetchAll } from 'data/CMA/FetchAll';
import * as Authentication from 'Authentication';
import * as Config from 'Config';
import { get } from 'lodash';
import { deepFreezeClone } from 'utils/Freeze';

/**
 * @ngdoc module
 * @description
 * This service should hold all context related to an organization - currently
 * only users.
 *
 * It can be accessed as a property on `spaceContext`, linked to the space's
 * organization.
 */

// `GET /organizations/:id/users` endpoint returns a max of 100 items
const PER_PAGE = 100;

/**
 * @ngdoc method
 * @name OrganizationContext#create
 * @constructs {OrganizationContext}
 * @description
 * Holds app context related to an organization.
 */
export function create (organization) {
  if (get(organization, 'sys.type') !== 'Organization') {
    throw new Error('First argument expected to be an organization');
  }

  const endpoint = createOrganizationEndpoint(
    Config.apiUrl(),
    organization.sys.id,
    Authentication
  );

  return {
    getId: function () {
      return organization.sys.id;
    },

    /**
     * @ngdoc property
     * @name OrganizationContext#getAllUsers
     */
    getAllUsers: function (query) {
      return fetchAll(endpoint, ['users'], PER_PAGE, query);
    },
    /**
     * @ngdoc property
     * @name OrganizationContext#organization
     * @type {Object}
     */
    organization: deepFreezeClone(organization)
  };
}
