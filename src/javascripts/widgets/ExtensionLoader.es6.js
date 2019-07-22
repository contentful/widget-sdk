import DataLoader from 'dataloader';
import { get, identity, pick } from 'lodash';

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

  // Given a list of IDs the `getExtensionsById` method returns
  // a list of Extension entities with provided IDs. If there
  // is no Extension for an ID, it is omittend in the result set.
  //
  // While the method us used, the cache is build up. Once cached
  // extension will be used until the current space/environment
  // changes or either `evictExtension` or `cacheExtension` is
  // called.
  //
  // Please note this method is intended to be used to load
  // extensions for entity editors where for performance reasons
  // we can live with slightly outdated extensions being rendered.
  const getExtensionsById = async extensionIds => {
    const result = await extensionLoader.loadMany(extensionIds);

    return result.filter(identity);
  };

  // Removes extension from the cache.
  // Use when an extension is removed from an environment.
  const evictExtension = id => extensionLoader.clear(id);

  // Updates the cached version of an extension.
  // Use when an extension is updated.
  const cacheExtension = extension => {
    const key = extension.sys.id;

    // We cannot prime over existing cache entries.
    // Evict the cached item first and only then prime.
    extensionLoader.clear(key).prime(key, extension);
  };

  // Fetches all Extension entities in an environment to be
  // used in listing views.
  //
  // Note they don't include srcdoc property so they cannot
  // be used for rendering and (for the same reason) cannot
  // be cached.
  const getAllExtensionsForListing = async () => {
    const { items } = await spaceEndpoint({
      method: 'GET',
      path: ['extensions'],
      query: {
        stripSrcdoc: 'true', // Yes this needs to be a string (it's a value in QS).
        limit: 1000 // No srcdoc due to `stripSrcdoc`. We can safely fetch 1000.
      }
    });

    return resolveExtensionDefinitions(items || []);
  };

  return {
    cacheExtension,
    evictExtension,
    getExtensionsById,
    getAllExtensionsForListing
  };
}
