import DataLoader from 'dataloader';
import { uniq, get, identity, omit } from 'lodash';

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
const isBasedOnExtensionDefinition = extension =>
  get(extension, ['extensionDefinition', 'sys', 'linkType']) === 'ExtensionDefinition';

const getExtensionDefinitionUUID = extension =>
  get(extension, ['extensionDefinition', 'sys', 'uuid']);

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

        // Dropping the extension
        return null;
      }

      return extension;
    })
    .filter(identity);
};

export function createExtensionLoader(orgEndpoint, spaceEndpoint) {
  const loadExtensionDefinitions = async uuids => {
    if (!Array.isArray(uuids) || uuids.length < 1) {
      return [];
    }

    const definitionResult = await orgEndpoint({
      method: 'GET',
      path: '/extension_definitions',
      query: {
        'sys.uuid[in]': uniq(uuids).join(',')
      }
    });

    return definitionResult.items || [];
  };

  const resolveExtensionDefinitions = async extensions => {
    const definitionUUIDs = extensions
      .filter(isBasedOnExtensionDefinition)
      .map(getExtensionDefinitionUUID);

    const definitions = await loadExtensionDefinitions(definitionUUIDs);

    return mergeExtensionsAndDefinitions(extensions, definitions);
  };

  const loadExtensions = async extensionIds => {
    const { items } = await spaceEndpoint({
      method: 'GET',
      path: '/extensions',
      query: {
        'sys.id[in]': extensionIds.join(',')
      }
    });

    const withDefinitions = await resolveExtensionDefinitions(items || [], orgEndpoint);

    return extensionIds.map(id =>
      withDefinitions.find(extension => get(extension, ['sys', 'id']) === id)
    );
  };

  const extensionLoader = new DataLoader(loadExtensions);

  const getExtensionsById = async extensionIds => {
    const result = await extensionLoader.loadMany(extensionIds);

    return result.filter(identity);
  };

  const getExtensionById = async extensionId => {
    const result = await getExtensionsById([extensionId]);

    return result.length > 0 ? result[0] : null;
  };

  const getAllExtensions = async () => {
    const { items } = await spaceEndpoint({ method: 'GET', path: '/extensions' });
    const maybeResolvedExtensions = await resolveExtensionDefinitions(items || [], orgEndpoint);
    const resolvedExtensions = maybeResolvedExtensions.filter(identity);

    // We cannot prime over existing cache entries.
    // Evict all the cached items first and then prime.
    extensionLoader.clearAll();
    resolvedExtensions.forEach(extension => {
      extensionLoader.prime(extension.sys.id, extension);
    });

    return resolvedExtensions;
  };

  const evictExtension = id => extensionLoader.clear(id);

  const cacheExtension = extension => {
    const key = extension.sys.id;

    // As above, cache eviction is needed before priming.
    extensionLoader.clear(key).prime(key, extension);
  };

  return {
    cacheExtension,
    evictExtension,
    getAllExtensions,
    getExtensionsById,
    getExtensionById
  };
}
