import DataLoader from 'dataloader';
import { memoize, get } from 'lodash';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';

// This module exposes 2 retrieval methods:
// - `getExtensionsById` allows to get extensions
//   of provided IDs.
// - `getAllExtensions` returns all extensions.
//
// While the methods are used, a cache is build up.
// Once cached extension will be used up until the
// end of a user session when using `getExtensionsById`.
//
// `getAllExtensions` always evicts the whole cache.
// `cacheExtension` allows to replace a single item
// (for example when an extension was modified in
// management views).
//
// Please note this module is intended to be used
// to load extensions for entity editors where we
// can live with slightly outdated extensions being
// rendered. Management views (managing `Extension`
// entities) should be done with a client that always
// does HTTP.

const getEndpointForSpaceEnv = memoize((spaceId, envId) => {
  return createSpaceEndpoint(spaceId, envId);
});

const getLoaderForSpaceEnv = memoize((spaceId, envId) => {
  const endpoint = getEndpointForSpaceEnv(spaceId, envId);

  return new DataLoader(async extensionIds => {
    const { items } = await endpoint({
      method: 'GET',
      // TODO: It still loads all extensions.
      // Once we modify the API we should do the following:
      // /extensions?sys.id[in]=${extensionIds.join(',')}
      path: '/extensions'
    });

    return extensionIds.map(extensionId => {
      const extension = (items || []).find(item => {
        return extensionId === get(item, ['sys', 'id']);
      });

      return extension || null;
    });
  });
});

export async function getExtensionsById(spaceId, envId, extensionIds) {
  const loader = getLoaderForSpaceEnv(spaceId, envId);

  const extensions = await loader.loadMany(extensionIds);

  return extensions.filter(extension => !!extension);
}

export async function getAllExtensions(spaceId, envId) {
  const endpoint = getEndpointForSpaceEnv(spaceId, envId);

  const { items } = await endpoint({ method: 'GET', path: '/extensions' });

  const loader = getLoaderForSpaceEnv(spaceId, envId);

  // We cannot prime over existing cache entries.
  // Evict all the cached items first and then prime.
  loader.clearAll();
  (items || []).forEach(extension => {
    loader.prime(extension.sys.id, extension);
  });

  return items;
}

export function cacheExtension(spaceId, envId, extension) {
  const loader = getLoaderForSpaceEnv(spaceId, envId);
  const key = extension.sys.id;

  // As above, cache eviction is needed before priming.
  loader.clear(key).prime(key, extension);
}
