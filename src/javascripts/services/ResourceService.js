import { canCreate, canCreateResources, generateMessage } from 'utils/ResourceUtils';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/EndpointFactory';
import { snakeCase, camelCase } from 'lodash';

const alphaHeader = {
  'x-contentful-enable-alpha-feature': 'subscriptions-api'
};

export default function createResourceService(id, type = 'space', envId) {
  const endpoint = createEndpoint(id, type, envId);

  return {
    get,
    getAll,
    canCreate: resourceType => get(resourceType).then(canCreate),
    canCreateEnvironmentResources: environmentId => getAll(environmentId).then(canCreateResources),
    messagesFor: resourceType => get(resourceType).then(generateMessage),
    async messages() {
      const resources = await getAll();
      return resources.reduce((memo, resource) => {
        const resourceType = camelCase(resource.sys.id);

        memo[resourceType] = generateMessage(resource);

        return memo;
      }, {});
    }
  };

  async function get(resourceType, environmentId) {
    if (!resourceType) {
      throw new Error('resourceType not supplied to ResourceService.get');
    }

    const apiResourceType = snakeCase(resourceType);
    let path = ['resources', apiResourceType];

    if (environmentId) path = ['environments', environmentId, 'resources', apiResourceType];

    return endpoint(
      {
        method: 'GET',
        path
      },
      {
        ...alphaHeader
      }
    );
  }

  async function getAll(environmentId) {
    let path = ['resources'];
    if (environmentId) path = ['environments', environmentId, 'resources'];

    const raw = await endpoint(
      {
        method: 'GET',
        path
      },
      {
        ...alphaHeader
      }
    );
    return raw.items;
  }
}

function createEndpoint(id, type, envId) {
  if (type === 'organization') {
    return createOrganizationEndpoint(id);
  }

  if (envId) {
    return createSpaceEndpoint(id, envId);
  }

  return createSpaceEndpoint(id);
}
