import DataLoader from 'dataloader';
import { memoize, get, identity, omit } from 'lodash';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/EndpointFactory.es6';

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
// `evictExtension` removes a single item for the cache.
//
// Please note this module is intended to be used
// to load extensions for entity editors where we
// can live with slightly outdated extensions being
// rendered. Management views (managing `Extension`
// entities) should be done with a client that always
// does HTTP.

// Produces a key for memoization. `_.memoize` by default
// only uses first argument to the function being memoized
// as a cache key.
const makeMemoizationKey = (orgId, spaceId, envId) => [orgId, spaceId, envId].join('!');

const getEndpointsForSpaceEnv = memoize((orgId, spaceId, envId) => {
  return {
    spaceEndpoint: createSpaceEndpoint(spaceId, envId),
    orgEndpoint: createOrganizationEndpoint(orgId)
  };
}, makeMemoizationKey);

const loadExtensionDefinitions = async (orgEndpoint, uuids) => {
  if (!Array.isArray(uuids)) {
    return [];
  }

  const definitionResult = await orgEndpoint({
    method: 'GET',
    path: '/extension_definitions',
    query: {
      'sys.uuid[in]': uuids.join(',')
    }
  });

  return definitionResult.items || [];
};

const isBasedOnExtensionDefinition = extension =>
  get(extension, ['extensionDefinition', 'linkType']) === 'ExtensionDefinition';

const getExtensionDefinitionUUID = extension => get(extension, ['extensionDefinition', 'uuid']);

const mergeExtensionsAndDefinitions = (extensions, definitions) => {
  return extensions
    .map(extension => {
      const definitionId = getExtensionDefinitionUUID(extension);

      if (definitionId) {
        const definition = definitions.find(
          definition => get(definition, ['sys', 'uuid']) === definitionId
        );

        if (definition) {
          return {
            ...extension,
            extension: omit(definition, ['sys'])
          };
        }

        // So what are we going to do about this then?
        // Dropping the extension for now
        return null;
      }

      return extension;
    })
    .filter(identity);
};

const resolveExtensionDefinitions = async (extensions, orgEndpoint) => {
  const definitionUUIDs = extensions
    .filter(isBasedOnExtensionDefinition)
    .map(getExtensionDefinitionUUID);

  const definitions = await loadExtensionDefinitions(orgEndpoint, definitionUUIDs);

  return mergeExtensionsAndDefinitions(extensions, definitions);
};

const getLoaderForSpaceEnv = memoize((orgId, spaceId, envId) => {
  const { spaceEndpoint, orgEndpoint } = getEndpointsForSpaceEnv(orgId, spaceId, envId);

  return new DataLoader(async extensionIds => {
    const { items } = await spaceEndpoint({
      method: 'GET',
      // TODO: It still loads all extensions.
      // Once we modify the API we should do the following:
      // /extensions?sys.id[in]=${extensionIds.join(',')}
      path: '/extensions'
    });

    const resolvedExtensions = resolveExtensionDefinitions(items || [], orgEndpoint);

    return resolvedExtensions.filter(extension =>
      extensionIds.includes(get(extension, ['sys', 'id']))
    );
  });
}, makeMemoizationKey);

export async function getExtensionsById(orgId, spaceId, envId, extensionIds) {
  const loader = getLoaderForSpaceEnv(orgId, spaceId, envId);

  const extensions = await loader.loadMany(extensionIds);

  return extensions.filter(extension => !!extension);
}

export async function getAllExtensions(orgId, spaceId, envId) {
  const { orgEndpoint, spaceEndpoint } = getEndpointsForSpaceEnv(spaceId, envId);

  const { items } = await spaceEndpoint({ method: 'GET', path: '/extensions' });

  const resolvedExtensions = resolveExtensionDefinitions(items || [], orgEndpoint);

  const loader = getLoaderForSpaceEnv(orgId, spaceId, envId);

  // We cannot prime over existing cache entries.
  // Evict all the cached items first and then prime.
  loader.clearAll();
  resolvedExtensions.forEach(extension => {
    loader.prime(extension.sys.id, extension);
  });

  return items;
}

export function evictExtension(orgId, spaceId, envId, extensionId) {
  const loader = getLoaderForSpaceEnv(orgId, spaceId, envId);

  loader.clear(extensionId);
}

export function cacheExtension(orgId, spaceId, envId, extension) {
  const loader = getLoaderForSpaceEnv(orgId, spaceId, envId);
  const key = extension.sys.id;

  // As above, cache eviction is needed before priming.
  loader.clear(key).prime(key, extension);
}
