import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { fetchAllWithIncludes } from 'data/CMA/FetchAll';
import getOrgId from 'redux/selectors/getOrgId';
import { TEAMS_API, getAlphaHeader } from 'alphaHeaders.js';

const BATCH_LIMIT = 100;
const HEADERS = getAlphaHeader(TEAMS_API);

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

  function getAll(query = {}) {
    return fetchAllWithIncludes(endpoint, ['team_space_memberships'], BATCH_LIMIT, query, HEADERS);
  }

  /**
   *
   * @param {String} teamId The id of the team getting access to the space
   * @param {Object} data
   * @param {Boolean} data.admin
   * @param {Array<Object>} data.roles An array of role links
   */
  function create(teamId, spaceId, { admin = false, roles = [] } = {}) {
    const spaceEndpoint = createSpaceEndpoint(spaceId);
    return spaceEndpoint(
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
    const spaceEndpoint = createSpaceEndpoint(sys.space.sys.id);
    return spaceEndpoint(
      {
        method: 'PUT',
        path: ['team_space_memberships', sys.id],
        data: { admin, roles },
        version: sys.version
      },
      getTeamHeaders(sys.team.sys.id)
    );
  }

  function remove(teamSpaceMembershipId, teamSpaceMembership) {
    const spaceEndpoint = createSpaceEndpoint(teamSpaceMembership.sys.space.sys.id);
    return spaceEndpoint(
      {
        method: 'DELETE',
        path: ['team_space_memberships', teamSpaceMembershipId]
      },
      HEADERS
    );
  }
}
