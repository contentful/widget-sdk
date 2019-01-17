import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { fetchAll } from 'data/CMA/FetchAll.es6';

const ALPHA_HEADER = { 'x-contentful-enable-alpha-feature': 'teams-api' };
const BATCH_LIMIT = 100;

export default function createTeamService(orgId) {
  const endpoint = createOrganizationEndpoint(orgId);

  return {
    get,
    getAll,
    create,
    update,
    remove,
    getTeamMemberships,
    getAllTeamMemberships,
    createTeamMembership,
    removeTeamMembership
  };

  function get(id) {
    return endpoint(
      {
        method: 'GET',
        path: ['teams', id]
      },
      ALPHA_HEADER
    );
  }

  function getAll() {
    return fetchAll(endpoint, ['teams'], BATCH_LIMIT, {}, ALPHA_HEADER);
  }

  function create({ name, description }) {
    return endpoint(
      {
        method: 'POST',
        path: ['teams'],
        data: { name, description }
      },
      ALPHA_HEADER
    );
  }

  function update({ name, description, sys }) {
    return endpoint(
      {
        method: 'PUT',
        path: ['teams', sys.id],
        data: { name, description },
        version: sys.version
      },
      ALPHA_HEADER
    );
  }

  function remove(teamId) {
    return endpoint(
      {
        method: 'DELETE',
        path: ['teams', teamId]
      },
      ALPHA_HEADER
    );
  }

  function getAllTeamMemberships() {
    return fetchAll(endpoint, ['team_memberships'], BATCH_LIMIT, {}, ALPHA_HEADER);
  }

  function getTeamMemberships(teamId) {
    return fetchAll(endpoint, ['teams', teamId, 'team_memberships'], BATCH_LIMIT, {}, ALPHA_HEADER);
  }

  function createTeamMembership(teamId, organizationMembershipId, admin = false) {
    return endpoint(
      {
        method: 'POST',
        path: ['teams', teamId, 'team_memberships'],
        data: { organizationMembershipId, admin }
      },
      ALPHA_HEADER
    );
  }

  function removeTeamMembership(teamId, teamMembershipId) {
    return endpoint(
      {
        method: 'DELETE',
        path: ['teams', teamId, 'team_memberships', teamMembershipId]
      },
      ALPHA_HEADER
    );
  }
}
