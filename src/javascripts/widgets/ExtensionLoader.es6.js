import DataLoader from 'dataloader';
import { get, identity, pick } from 'lodash';

// This module exposes 2 retrieval methods:
// - `getExtensionsById` allows to get extensions
//   of provided IDs.
// - `getAllExtensions` returns all extensions.
//
// While the methods are used, a cache is build up.
// Once cached extension will be used until the current
// space cahnges when using `getExtensionsById`.
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

const getExtensionDefinitionID = extension => get(extension, ['extensionDefinition', 'sys', 'id']);

const mergeExtensionsAndDefinitions = (extensions, definitions) => {
  return extensions
    .map(extension => {
      const definitionId = getExtensionDefinitionID(extension);

      if (!definitionId) {
        // Do not resolve definition but return the extension.
        // It should already have all the properties required
        // defined inline on it.
        return extension;
      }

      const definition = definitions[definitionId];
      if (!definition) {
        // Extension exists and points to a definition but
        // the definition doesn't exist. Drop the extension.
        return null;
      }

      // Enrich the extension with definition data.
      return {
        ...extension,
        extension: pick(definition, ['name', 'src', 'fieldTypes', 'parameters'])
      };
    })
    .filter(identity);
};

export function createExtensionLoader(extensionDefinitionLoader, spaceEndpoint) {
  const resolveExtensionDefinitions = async extensions => {
    const definitionIDs = extensions
      .filter(isBasedOnExtensionDefinition)
      .map(getExtensionDefinitionID);

    const definitions = await extensionDefinitionLoader.getByIds(definitionIDs);

    return mergeExtensionsAndDefinitions(extensions, definitions);
  };

  const loadExtensions = async extensionIds => {
    if (!Array.isArray(extensionIds) || extensionIds.length === 0) {
      return [];
    }

    const { items } = await spaceEndpoint({
      method: 'GET',
      path: ['extensions'],
      query: {
        'sys.id[in]': extensionIds.join(',')
      }
    });

    const withDefinitions = await resolveExtensionDefinitions(items || []);

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
    const { items } = await spaceEndpoint({
      method: 'GET',
      path: ['extensions']
    });

    const maybeResolvedExtensions = await resolveExtensionDefinitions(items || []);
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
