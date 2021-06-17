import type { SpaceEndpoint, OrganizationEndpoint, CollectionResponse } from 'data/CMA/types';
import {
  canCreate,
  canCreateResources,
  generateMessage,
  getEnvironmentResources,
} from 'utils/ResourceUtils';
import { snakeCase, camelCase, memoize } from 'lodash';
import { SUBSCRIPTIONS_API, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(SUBSCRIPTIONS_API);

type Resource = {
  limits: { included: number; maximum: number };
  name: string;
  parent?: unknown;
  period?: unknown;
  sys: {
    id: string;
    type: 'OrganizationResource' | 'SpaceResource' | 'EnvironmentResource';
  };
  unitOfMeasure?: unknown;
  usage: number;
};

/**
 * @description
 * The `getAll` response is cached for 30 seconds to avoid repeated promise calls to `/resources`.
 * The `get` method will try to find the resource from a cached response if there is any.
 *
 * Use the instance exposed via `useSpaceEnvContext` to benefit from this optimisation.
 *
 * const { spaceResources, environmentResources } = useSpaceEnvContext;
 */

export default function createResourceService(endpoint: SpaceEndpoint | OrganizationEndpoint) {
  // memonizes the response for 30000 ms and then expires the cache
  const getAll = memoize(async () => {
    setTimeout(() => {
      getAll.cache.clear?.();
    }, 30000);

    const raw = await endpoint<CollectionResponse<Resource>>(
      {
        method: 'GET',
        path: ['resources'],
      },
      alphaHeader
    );

    return raw.items;
  });

  return {
    get,
    getAll,
    canCreate: (resourceType) => get(resourceType).then(canCreate),
    canCreateEnvironmentResources: () =>
      getAll().then(getEnvironmentResources).then(canCreateResources),
    messagesFor: (resourceType) => get(resourceType).then(generateMessage),
    async messages() {
      const resources = await getAll();
      return resources.reduce((memo, resource) => {
        const resourceType = camelCase(resource.sys.id);

        memo[resourceType] = generateMessage(resource);

        return memo;
      }, {});
    },
  };

  async function get(resourceType) {
    if (!resourceType) {
      throw new Error('resourceType not supplied to ResourceService.get');
    }

    const apiResourceType = snakeCase(resourceType);

    // if we have cached `getAll` response, use that
    if (getAll.cache.has(undefined)) {
      return getAll().then((resources) => {
        const resource = resources.find((resource) => resource.sys.id === apiResourceType);
        if (!resource) {
          throw new Error(`The resource ${resourceType} could not be found.`);
        }
        return resource;
      });
    }

    return endpoint<Resource>(
      {
        method: 'GET',
        path: ['resources', apiResourceType],
      },
      alphaHeader
    );
  }
}
