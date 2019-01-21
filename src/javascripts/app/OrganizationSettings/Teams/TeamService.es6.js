import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { fetchAll } from 'data/CMA/FetchAll.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';

const ALPHA_HEADER = { 'x-contentful-enable-alpha-feature': 'teams-api' };
const BATCH_LIMIT = 100;

export default function createTeamService(state) {
  const orgId = getOrgId(state);
  const endpoint = createOrganizationEndpoint(orgId);

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
}
