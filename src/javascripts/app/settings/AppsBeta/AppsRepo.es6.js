import { countBy } from 'lodash';

// App ID to ExtensionDefinition ID
const APP_TO_EXTENSION_DEFINITION = {
  netlify: '3VJXxF6XcYPl4akixQuJlc'
};

// Order on the list, values are App IDs
const APP_ORDER = ['netlify'];

export default function createAppsRepo(extensionDefinitionLoader, spaceEndpoint) {
  return {
    getApps,
    getExtensionDefinitionForApp,
    getExtensionForExtensionDefinition
  };

  async function getApps() {
    const ids = APP_ORDER.map(appId => APP_TO_EXTENSION_DEFINITION[appId]);

    const [extensionDefinitionMap, extensionMap] = await Promise.all([
      extensionDefinitionLoader.getByIds(ids),
      getExtensionsForExtensionDefinitions(ids)
    ]);

    return APP_ORDER.map(appId => {
      const definitionId = APP_TO_EXTENSION_DEFINITION[appId];

      return {
        sys: { type: 'App', id: appId },
        extensionDefinition: extensionDefinitionMap[definitionId],
        extension: extensionMap[definitionId]
      };
    }).filter(app => !!app.extensionDefinition);
  }

  function getExtensionDefinitionForApp(appId) {
    return extensionDefinitionLoader.getById(APP_TO_EXTENSION_DEFINITION[appId]);
  }

  async function getExtensionForExtensionDefinition(extensionDefinitionId) {
    const { items } = await spaceEndpoint({
      method: 'GET',
      path: ['extensions'],
      query: { 'extensionDefinition.sys.id[in]': extensionDefinitionId }
    });

    if (items.length === 1) {
      return items[0];
    } else {
      const err = new Error(
        `Expected exactly one Extension to be based on ExtensionDefinition ${extensionDefinitionId}.`
      );
      err.extensionCount = items.length;
      throw err;
    }
  }

  async function getExtensionsForExtensionDefinitions(extensionDefinitionIds) {
    const { items } = await spaceEndpoint({
      method: 'GET',
      path: ['extensions'],
      query: { 'extensionDefinition.sys.id[in]': extensionDefinitionIds.join(',') }
    });

    const extensionCountsByDefinition = countBy(items, e => e.extensionDefinition.sys.id);
    const uniquelyUsedDefinitions = Object.keys(extensionCountsByDefinition).filter(
      definitionId => {
        return extensionCountsByDefinition[definitionId] === 1;
      }
    );

    return items
      .filter(ext => uniquelyUsedDefinitions.includes(ext.extensionDefinition.sys.id))
      .reduce((acc, ext) => ({ ...acc, [ext.extensionDefinition.sys.id]: ext }), {});
  }
}
