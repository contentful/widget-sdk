import { countBy, get, identity } from 'lodash';
import resolveResponse from 'contentful-resolve-response';

const DEV_APP_PREFIX = 'dev-app';
const DEV_APP_SEPARATOR = '_';
const APP_MARKETPLACE_SPACE_ID = 'lpjm8d10rkpy';
const APP_MARKETPLACE_TOKEN = 'XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk';
const APPS_LISTING_ENTRY_ID = '2fPbSMx3baxlwZoCyXC7F1';

const SPACE_ENDPOINT = `https://cdn.contentful.com/spaces/${APP_MARKETPLACE_SPACE_ID}`;
const APP_LISTING_ENDPOINT = `${SPACE_ENDPOINT}/entries?include=10&sys.id[in]=${APPS_LISTING_ENTRY_ID}`;
const getAppEndpoint = appId =>
  `${SPACE_ENDPOINT}/entries?include=10&content_type=app&fields.slug[in]=${appId}`;
const FETCH_CONFIG = {
  headers: {
    Authorization: `Bearer ${APP_MARKETPLACE_TOKEN}`
  }
};

async function fetchMarketplaceApps() {
  const res = await window.fetch(APP_LISTING_ENDPOINT, FETCH_CONFIG);
  const data = res.ok ? await res.json() : {};
  const [marketplaceApps] = resolveResponse(data);
  return get(marketplaceApps, ['fields', 'apps'], []);
}

export default function createAppsRepo(extensionDefinitionLoader, spaceEndpoint) {
  return {
    getAppWidgets,
    getMarketplaceApps,
    getDefinitionIdsOfApps,
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
    const marketplaceApps = await this.getMarketplaceApps();

    return marketplaceApps
      .map(app => app.extensionDefinitionId)
      .filter(id => typeof id === 'string' && id.length > 0);
  }

  async function getAppWidgets() {
    const marketplaceApps = await fetchMarketplaceApps();

    return marketplaceApps.map(app => ({
      extensionDefinitionId: get(app, ['fields', 'extensionDefinitionId']),
      icon: get(app, ['fields', 'icon', 'fields', 'file', 'url'], ''),
      id: get(app, ['fields', 'slug'], '')
    }));
  }

  async function getMarketplaceApps() {
    const marketplaceApps = await fetchMarketplaceApps();

    const definitionIds = marketplaceApps
      .map(app => get(app, ['fields', 'extensionDefinitionId'], null))
      .filter(identity);
    const [extensionDefinitionMap, extensionMap] = await Promise.all([
      extensionDefinitionLoader.getByIds(definitionIds),
      getExtensionsForExtensionDefinitions(definitionIds)
    ]);

    return (
      marketplaceApps
        .map(app => {
          const extensionDefinitionId = get(app, ['fields', 'extensionDefinitionId']);
          const title = get(app, ['fields', 'title'], '');
          const permissionsText = get(app, ['fields', 'permissions', 'fields', 'text'], '');
          const actionList = get(app, ['fields', 'uninstallMessages'], []).map(
            ({ fields }) => fields
          );
          return {
            actionList,
            author: {
              name: get(app, ['fields', 'developer', 'fields', 'name']),
              url: get(app, ['fields', 'developer', 'fields', 'websiteUrl']),
              icon: get(app, ['fields', 'developer', 'fields', 'icon', 'fields', 'file', 'url'])
            },
            categories: get(app, ['fields', 'categories'], []).map(category => category.fields),
            description: get(app, ['fields', 'description'], ''),
            extensionDefinitionId,
            extensionDefinition: extensionDefinitionMap[extensionDefinitionId],
            flagId: get(app, ['fields', 'productCatalogFlag', 'fields', 'flagId']),
            icon: get(app, ['fields', 'icon', 'fields', 'file', 'url'], ''),
            id: get(app, ['fields', 'slug'], ''),
            installed: !!extensionMap[extensionDefinitionId],
            links: get(app, ['fields', 'links'], []).map(link => link.fields),
            permissions: `__${title} app__ ${permissionsText}`,
            permissionsExplanation: get(app, ['fields', 'permissionsExplanation']),
            tagLine: get(app, ['fields', 'tagLine'], ''),
            title
          };
        })
        // Filter out - possibly forgotten - broken references in the Apps Listing entry
        .filter(app => !!app.extensionDefinition)
    );
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

  async function getExtensionDefinitionForApp(appId) {
    if (appId.startsWith(DEV_APP_PREFIX + DEV_APP_SEPARATOR)) {
      const [, extensionDefinitionId] = appId.split(DEV_APP_SEPARATOR);
      return extensionDefinitionLoader.getById(extensionDefinitionId);
    }

    const res = await window.fetch(getAppEndpoint(appId), FETCH_CONFIG);
    const data = res.ok ? await res.json() : {};
    const [app] = resolveResponse(data);
    const definitionId = get(app, ['fields', 'extensionDefinitionId'], null);

    return extensionDefinitionLoader.getById(definitionId);
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
