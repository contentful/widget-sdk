import { getSpace, getOrganization } from 'services/TokenStore.es6';
import {
  canCreate,
  generateMessage,
  useLegacy,
  getLegacyLimit,
  getLegacyUsage
} from 'utils/ResourceUtils.es6';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { snakeCase, camelCase } from 'lodash';

export default function createResourceService(id, type = 'space') {
  const endpoint = createEndpoint(id, type);

  return {
    get,
    getAll,
    canCreate: resourceType => get(resourceType).then(canCreate),
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

  async function get(resourceType) {
    if (!resourceType) {
      throw new Error('resourceType not supplied to ResourceService.get');
    }

    const organization = await getTokenOrganization(id, type);
    const legacy = await useLegacy(organization);

    if (legacy) {
      const limit = getLegacyLimit(resourceType, organization);
      const usage = getLegacyUsage(resourceType, organization);

      return createResourceFromTokenData(resourceType, limit, usage);
    } else {
      const apiResourceType = snakeCase(resourceType);

      return endpoint(
        {
          method: 'GET',
          path: ['resources', apiResourceType]
        },
        {
          'x-contentful-enable-alpha-feature': 'subscriptions-api'
        }
      );
    }
  }

  async function getAll() {
    const raw = await endpoint(
      {
        method: 'GET',
        path: ['resources']
      },
      {
        'x-contentful-enable-alpha-feature': 'subscriptions-api'
      }
    );
    return raw.items;
  }
}

function createEndpoint(id, type) {
  const endpointFactory = type === 'space' ? createSpaceEndpoint : createOrganizationEndpoint;

  return endpointFactory(id);
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
