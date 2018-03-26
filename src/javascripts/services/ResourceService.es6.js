import { getSpace, getOrganization } from 'services/TokenStore';
import { canCreate, generateMessage, useLegacy, getLegacyLimit, getLegacyUsage } from 'utils/ResourceUtils';
import { runTask } from 'utils/Concurrent';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/EndpointFactory';

import $q from '$q';
import { snakeCase, camelCase } from 'lodash';

export default function createResourceService (id, type = 'space') {
  const endpoint = createEndpoint(id, type);

  return {
    get,
    getAll,
    canCreate: (resourceType) => get(resourceType).then(canCreate),
    messagesFor: (resourceType) => get(resourceType).then(generateMessage),
    messages: function () {
      return getAll().then(resources => resources.reduce((memo, resource) => {
        const resourceType = camelCase(resource.sys.id);

        memo[resourceType] = generateMessage(resource);

        return memo;
      }, {}));
    }
  };
  function get (resourceType) {
    return $q.resolve(runTask(function* () {
      if (!resourceType) {
        throw new Error('resourceType not supplied to ResourceService.get');
      }

      const organization = yield getTokenOrganization(id, type);
      const legacy = yield useLegacy(organization);

      if (legacy) {
        const limit = getLegacyLimit(resourceType, organization);
        const usage = getLegacyUsage(resourceType, organization);

        return createResourceFromTokenData(resourceType, limit, usage);
      } else {
        const apiResourceType = snakeCase(resourceType);

        return yield endpoint({
          method: 'GET',
          path: [ 'resources', apiResourceType ]
        }, {
          'x-contentful-enable-alpha-feature': 'subscriptions-api'
        });
      }
    }));
  }
  function getAll () {
    return endpoint({
      method: 'GET',
      path: [ 'resources' ]
    }, {
      'x-contentful-enable-alpha-feature': 'subscriptions-api'
    }).then(function (raw) {
      return raw.items;
    });
  }
}

function createEndpoint (id, type) {
  const endpointFactory = type === 'space' ? createSpaceEndpoint : createOrganizationEndpoint;

  return endpointFactory(id);
}

function createResourceFromTokenData (resourceType, limit, usage) {
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

function getTokenOrganization (id, type) {
  let promise;

  if (type === 'space') {
    promise = getSpace(id).then(space => {
      return space.organization;
    });
  } else if (type === 'organization') {
    promise = getOrganization(id);
  }

  return promise;
}
