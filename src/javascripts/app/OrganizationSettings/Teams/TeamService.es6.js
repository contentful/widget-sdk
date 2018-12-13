import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

const ALPHA_HEADER = { 'x-contentful-enable-alpha-feature': 'teams-api' };

export default function createTeamService(orgId) {
  const endpoint = createOrganizationEndpoint(orgId);

  return {
    get,
    getAll,
    create,
    update,
    getTeamMemberships,
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
    return endpoint(
      {
        method: 'GET',
        path: ['teams']
      },
      ALPHA_HEADER
    );
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

  function update(id, { name, description, sys }) {
    return endpoint(
      {
        method: 'PUT',
        path: ['teams', id],
        data: { name, description },
        version: sys.version
      },
      ALPHA_HEADER
    );
  }

  function getTeamMemberships(teamId, query) {
    return endpoint(
      {
        method: 'GET',
        path: ['teams', teamId, 'team_memberships'],
        query
      },
      ALPHA_HEADER
    );
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
