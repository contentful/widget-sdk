import { countBy, get } from 'lodash';
import resolveResponse from 'contentful-resolve-response';

// App ID to ExtensionDefinition ID
// https://contentful.atlassian.net/wiki/spaces/PROD/pages/1512800260/Contentful+Apps+organization
const APP_TO_EXTENSION_DEFINITION = {
  netlify: '1VchawWvbIClHuMIyxwR5m',
  gatsby: '35f8xJFaJpOUFAKepAWiUj',
  optimizely: 'i43PggcHag2PCrGjYTiIX',
  cloudinary: 'zjcnWgBknf9zB7IM9HZjE',
  bynder: '5KySdUzG7OWuCE2V3fgtIa'
};

// Order on the list, values are App IDs
const APP_ORDER = ['netlify', 'gatsby', 'optimizely', 'cloudinary', 'bynder'];

const DEV_APP_PREFIX = 'dev-app';
const DEV_APP_SEPARATOR = '_';
const APP_MARKETPLACE_SPACE_ID = 'lpjm8d10rkpy';
const APP_MARKETPLACE_TOKEN = 'XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk';

export default function createAppsRepo(extensionDefinitionLoader, spaceEndpoint) {
  return {
    getAppsListing,
    getDefinitionIdsOfApps,
    getApps,
    getDevApps,
    getExtensionDefinitionForApp,
    getExtensionForExtensionDefinition,
    isDevApp
  };

  function isDevApp(appId) {
    if (typeof appId !== 'string') {
      return false;
    }

    return appId.startsWith(DEV_APP_PREFIX);
  }

  async function getDefinitionIdsOfApps() {
    const appsListing = await this.getAppsListing();

    return Object.keys(appsListing).map(key =>
      get(appsListing[key], ['fields', 'extensionDefinitionId'])
    );
  }

  async function getAppsListing() {
    const res = await window.fetch(
      `https://cdn.contentful.com/spaces/${APP_MARKETPLACE_SPACE_ID}/entries?include=10&content_type=app`,
      {
        headers: {
          Authorization: `Bearer ${APP_MARKETPLACE_TOKEN}`
        }
      }
    );

    const data = res.ok ? await res.json() : {};
    const entries = resolveResponse(data);

    if (!Array.isArray(entries)) {
      return {};
    }

    return entries.reduce((acc, entry) => {
      return { ...acc, [entry.sys.id]: entry };
    }, {});
  }

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
