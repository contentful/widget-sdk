import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { fetchAll } from 'data/CMA/FetchAll';
import getOrgId from 'redux/selectors/getOrgId';
import { getCurrentTeam } from 'redux/selectors/teams';
import { TEAMS_API, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(TEAMS_API);
const BATCH_LIMIT = 100;

export default function createTeamMembershipService(state) {
  const orgId = getOrgId(state);
  const teamId = getCurrentTeam(state);
  const endpoint = createOrganizationEndpoint(orgId);

  return {
    getAll,
    create,
    remove,
  };

  function getAll() {
    return fetchAll(endpoint, ['team_memberships'], BATCH_LIMIT, {}, alphaHeader);
  }

  function create(organizationMembershipId, admin = false) {
    return endpoint(
      {
        method: 'POST',
        path: ['teams', teamId, 'team_memberships'],
        data: { organizationMembershipId, admin },
      },
      alphaHeader
    );
  }

  function remove(teamMembershipId) {
    return endpoint(
      {
        method: 'DELETE',
        path: ['teams', teamId, 'team_memberships', teamMembershipId],
      },
      alphaHeader
    );
  }
}
