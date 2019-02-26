import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { fetchAll } from 'data/CMA/FetchAll.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';

const BATCH_LIMIT = 100;
const HEADERS = { 'x-contentful-enable-alpha-feature': 'teams-api' };

export default function createTeamMembershipsService(state) {
  const orgId = getOrgId(state);
  const endpoint = createOrganizationEndpoint(orgId);
  const getTeamHeaders = teamId => ({
    ...HEADERS,
    'x-contentful-team': teamId
  });

  return {
    get,
    getAll,
    create,
    update,
    remove
  };

  function get(id) {
    return endpoint(
      {
        method: 'GET',
        path: ['team_space_memberships', id]
      },
      HEADERS
    );
  }

  function getAll() {
    return fetchAll(endpoint, ['team_space_memberships'], BATCH_LIMIT, {}, HEADERS);
  }

  /**
   *
   * @param {String} teamId The id of the team getting access to the space
   * @param {Object} data
   * @param {Boolean} data.admin
   * @param {Array<Object>} data.roles An array of role links
   */
  function create(teamId, { admin = false, roles = [] } = {}) {
    return endpoint(
      {
        method: 'POST',
        path: ['team_space_memberships'],
        data: { admin, roles }
      },
      getTeamHeaders(teamId)
    );
  }

  /**
   *
   * @param {Object} data
   * @param {Boolean} data.admin
   * @param {Array<Object>} data.roles An array of role links
   */
  function update({ admin, roles, sys }) {
    return endpoint(
      {
        method: 'PUT',
        path: ['team_space_memberships', sys.id],
        data: { admin, roles },
        version: sys.version
      },
      HEADERS
    );
  }

  function remove(teamSpaceMembershipId) {
    return endpoint(
      {
        method: 'DELETE',
        path: ['team_space_memberships', teamSpaceMembershipId]
      },
      HEADERS
    );
  }
}
