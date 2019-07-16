import { countBy } from 'lodash';

// App ID to ExtensionDefinition ID
const APP_TO_EXTENSION_DEFINITION = {
  netlify: '3VJXxF6XcYPl4akixQuJlc'
};

// Order on the list, values are App IDs
const APP_ORDER = ['netlify'];

export default function createAppsRepo(orgEndpoint, spaceEndpoint) {
  return {
    getApps,
    getExtensionDefinitionForApp,
    getExtensionForExtensionDefinition
  };

  async function getApps() {
    const ids = APP_ORDER.map(appId => APP_TO_EXTENSION_DEFINITION[appId]);

    const { items } = await orgEndpoint({
      method: 'GET',
      path: ['extension_definitions'],
      query: { 'sys.id[in]': ids }
    });

    const extensions = await getExtensionsForExtensionDefinitions(items);

    return APP_ORDER.map(appId => {
      const definitionId = APP_TO_EXTENSION_DEFINITION[appId];

      return {
        sys: { type: 'App', id: appId },
        extensionDefinition: items.find(item => item.sys.id === definitionId),
        extension: extensions.find(e => e.extensionDefinition.sys.id === definitionId)
      };
    }).filter(app => !!app.extensionDefinition);
  }

  function getExtensionDefinitionForApp(appId) {
    const extensionDefinitionId = APP_TO_EXTENSION_DEFINITION[appId];

    if (!extensionDefinitionId) {
      return Promise.reject(new Error(`App ${appId} couldn't be found.`));
    }

    return orgEndpoint({
      method: 'GET',
      path: ['extension_definitions', extensionDefinitionId]
    });
  }

  async function getExtensionForExtensionDefinition(extensionDefinition) {
    const id = extensionDefinition.sys.id;

    const { items } = await spaceEndpoint({
      method: 'GET',
      path: ['extensions'],
      query: { 'extensionDefinition.sys.id[in]': id }
    });

    if (items.length === 1) {
      return items[0];
    } else {
      const err = new Error(
        `Expected exactly one Extension to be based on ExtensionDefinition ${id}.`
      );
      err.extensionCount = items.length;
      throw err;
    }
  }

  async function getExtensionsForExtensionDefinitions(extensionDefinitions) {
    const ids = extensionDefinitions.map(d => d.sys.id);

    const { items } = await spaceEndpoint({
      method: 'GET',
      path: ['extensions'],
      query: { 'extensionDefinition.sys.id[in]': ids.join(',') }
    });

    const extensionCountsByDefinition = countBy(items, e => e.extensionDefinition.sys.id);
    const uniquelyUsedDefinitions = Object.keys(extensionCountsByDefinition).filter(
      definitionId => {
        return extensionCountsByDefinition[definitionId] === 1;
      }
    );

    return items.filter(e => uniquelyUsedDefinitions.includes(e.extensionDefinition.sys.id));
  }
}
