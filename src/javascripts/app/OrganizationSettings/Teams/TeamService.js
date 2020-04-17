import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { fetchAll } from 'data/CMA/FetchAll';
import getOrgId from 'redux/selectors/getOrgId';
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
    return endpoint({
      method: 'GET',
      path: ['teams', id],
    });
  }

  function getAll() {
    return fetchAll(endpoint, ['teams'], BATCH_LIMIT, {});
  }

  function create({ name, description }) {
    return endpoint({
      method: 'POST',
      path: ['teams'],
      data: { name, description },
    });
  }

  function update({ name, description, sys }) {
    return endpoint({
      method: 'PUT',
      path: ['teams', sys.id],
      data: { name, description },
      version: sys.version,
    });
  }

  function remove(teamId) {
    return endpoint({
      method: 'DELETE',
      path: ['teams', teamId],
    });
  }
}
