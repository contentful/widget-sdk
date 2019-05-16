import { getSpace, getOrganization } from 'services/TokenStore.es6';
import {
  canCreate,
  canCreateResources,
  generateMessage,
  isLegacyOrganization,
  getLegacyLimit,
  getLegacyUsage
} from 'utils/ResourceUtils.es6';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { snakeCase, camelCase } from 'lodash';

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

    const organization = await getTokenOrganization(id, type);
    const legacy = isLegacyOrganization(organization);

    if (legacy) {
      const limit = getLegacyLimit(resourceType, organization);
      const usage = getLegacyUsage(resourceType, organization);

      return createResourceFromTokenData(resourceType, limit, usage);
    } else {
      const apiResourceType = snakeCase(resourceType);
      let path = ['resources', apiResourceType];

      if (environmentId) path = ['environments', environmentId, 'resources', apiResourceType];

      return endpoint(
        {
          method: 'GET',
          path
        },
        {
          'x-contentful-enable-alpha-feature': 'subscriptions-api'
        }
      );
    }
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
        'x-contentful-enable-alpha-feature': 'subscriptions-api'
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

function createResourceFromTokenData(resourceType, limit, usage) {
  return {
    usage,
    limits: {
      included: limit,
      maximum: limit
    },
    sys: {
      id: resourceType,
      type: 'SpaceResource'
    }
  };
}

async function getTokenOrganization(id, type) {
  if (type === 'space') {
    const space = await getSpace(id);
    return space.organization;
  } else if (type === 'organization') {
    return getOrganization(id);
  }
}
