import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { fetchAll } from 'data/CMA/FetchAll.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { getCurrentTeam } from 'redux/selectors/teams.es6';

const ALPHA_HEADER = { 'x-contentful-enable-alpha-feature': 'teams-api' };
const BATCH_LIMIT = 100;

export default function createTeamMembershipService(state) {
  const orgId = getOrgId(state);
  const teamId = getCurrentTeam(state);
  const endpoint = createOrganizationEndpoint(orgId);

  return {
    getAll,
    create,
    remove
  };

  function getAll() {
    return fetchAll(endpoint, ['team_memberships'], BATCH_LIMIT, {}, ALPHA_HEADER);
  }

  function create(organizationMembershipId, admin = false) {
    return endpoint(
      {
        method: 'POST',
        path: ['teams', teamId, 'team_memberships'],
        data: { organizationMembershipId, admin }
      },
      ALPHA_HEADER
    );
  }

  function remove(teamMembershipId) {
    return endpoint(
      {
        method: 'DELETE',
        path: ['teams', teamId, 'team_memberships', teamMembershipId]
      },
      ALPHA_HEADER
    );
  }
}
