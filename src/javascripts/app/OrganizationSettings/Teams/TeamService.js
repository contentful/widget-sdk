import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { fetchAll } from 'data/CMA/FetchAll';
import getOrgId from 'redux/selectors/getOrgId';
import { TEAMS_API, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(TEAMS_API);
const BATCH_LIMIT = 100;

export default function createTeamService(state) {
  const orgId = getOrgId(state);
  const endpoint = createOrganizationEndpoint(orgId);

  return {
    get,
    getAll,
    create,
    update,
    remove,
  };

  function get(id) {
    return endpoint(
      {
        method: 'GET',
        path: ['teams', id],
      },
      alphaHeader
    );
  }

  function getAll() {
    return fetchAll(endpoint, ['teams'], BATCH_LIMIT, {}, alphaHeader);
  }

  function create({ name, description }) {
    return endpoint(
      {
        method: 'POST',
        path: ['teams'],
        data: { name, description },
      },
      alphaHeader
    );
  }

  function update({ name, description, sys }) {
    return endpoint(
      {
        method: 'PUT',
        path: ['teams', sys.id],
        data: { name, description },
        version: sys.version,
      },
      alphaHeader
    );
  }

  function remove(teamId) {
    return endpoint(
      {
        method: 'DELETE',
        path: ['teams', teamId],
      },
      alphaHeader
    );
  }
}
