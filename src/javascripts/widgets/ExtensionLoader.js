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
        extension: pick(definition, ['name', 'src', 'fieldTypes', 'parameters', 'locations'])
      };
    })
    .filter(identity);
};

export function createExtensionLoader(appDefinitionLoader, spaceEndpoint) {
  const resolveExtensionDefinitions = async extensions => {
    const definitionIDs = extensions
      .filter(isBasedOnExtensionDefinition)
      .map(getExtensionDefinitionID);

    const definitions = await appDefinitionLoader.getByIds(definitionIDs);

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
  // changes or `evictExtension` is called.
  //
  // Please note this method is intended to be used to load
  // extensions for entity editors where for performance reasons
  // we can live with slightly outdated extensions being rendered.
  const getExtensionsById = async extensionIds => {
    const result = await extensionLoader.loadMany(extensionIds);

    return result.filter(identity);
  };

  return {
    getExtensionsById,
    // Removes extension from the cache.
    // Use when an extension is modified or removed.
    evictExtension: id => extensionLoader.clear(id)
  };
}
