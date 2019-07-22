import { countBy } from 'lodash';

// App ID to ExtensionDefinition ID
const APP_TO_EXTENSION_DEFINITION = {
  netlify: '3VJXxF6XcYPl4akixQuJlc'
};

// Order on the list, values are App IDs
const APP_ORDER = ['netlify'];

const DEV_APP_PREFIX = 'dev-app';
const DEV_APP_SEPARATOR = '_';

export default function createAppsRepo(extensionDefinitionLoader, spaceEndpoint) {
  return {
    getApps,
    getDevApps,
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

  // This mechanism is only for us for developing Apps Beta.
  // TODO: remove or improve before we release.
  async function getDevApps() {
    const extensionDefinitions = await extensionDefinitionLoader.getAllForCurrentOrganization();

    if (extensionDefinitions.length < 1) {
      return [];
    }

    const extensionDefinitionIds = extensionDefinitions.map(def => def.sys.id);
    const extensionMap = await getExtensionsForExtensionDefinitions(extensionDefinitionIds);

    return extensionDefinitions.map(def => {
      return {
        sys: {
          type: 'DevApp',
          id: [DEV_APP_PREFIX, DEV_APP_SEPARATOR, def.sys.id].join('')
        },
        extensionDefinition: def,
        extension: extensionMap[def.sys.id]
      };
    });
  }

  function getExtensionDefinitionForApp(appId) {
    if (appId.startsWith(DEV_APP_PREFIX + DEV_APP_SEPARATOR)) {
      const [, extensionDefinitionId] = appId.split(DEV_APP_SEPARATOR);
      return extensionDefinitionLoader.getById(extensionDefinitionId);
    }

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
