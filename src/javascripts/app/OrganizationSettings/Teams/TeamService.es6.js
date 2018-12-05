import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

const ALPHA_HEADER = { 'x-contentful-enable-alpha-feature': 'teams-api' };

export default function createTeamService(orgId) {
  const endpoint = createOrganizationEndpoint(orgId);

  return {
    get,
    getAll,
    create,
    update
  };

  function get() {}

  function getAll() {}

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
}
