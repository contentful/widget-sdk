import { get, identity } from 'lodash';
import resolveResponse from 'contentful-resolve-response';

import { hasAllowedAppFeatureFlag } from './AppProductCatalog';

const DEV_APP_PREFIX = 'dev-app';
const DEV_APP_SEPARATOR = '_';
const APP_MARKETPLACE_SPACE_ID = 'lpjm8d10rkpy';
const APP_MARKETPLACE_TOKEN = 'XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk';
const APPS_LISTING_ENTRY_ID = '2fPbSMx3baxlwZoCyXC7F1';

const SPACE_ENDPOINT = `https://cdn.contentful.com/spaces/${APP_MARKETPLACE_SPACE_ID}`;
const APP_LISTING_ENDPOINT = `${SPACE_ENDPOINT}/entries?include=10&sys.id[in]=${APPS_LISTING_ENTRY_ID}`;
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

export default function createAppsRepo(appDefinitionLoader, spaceEndpoint) {
  return {
    getApps,
    getAppInstallation,
    // TODO: this is only used to pick apps out of /extensions
    // listing. Once we remove `extensionDefinition`-based extensions
    // from the listing we can drop this frontend filter.
    getDefinitionIdsOfApps
  };

  async function getDefinitionIdsOfApps() {
    const apps = await getApps();

    return apps
      .map(app => get(app, ['appDefinition', 'sys', 'id']))
      .filter(id => typeof id === 'string' && id.length > 0);
  }

  async function getApps() {
    const installationMap = await getAppDefinitionToInstallationMap();

    const [marketplaceApps, devApps] = await Promise.all([
      getMarketplaceApps(installationMap),
      getDevApps(installationMap)
    ]);

    return [...marketplaceApps, ...devApps].filter(hasAllowedAppFeatureFlag);
  }

  async function getMarketplaceApps(installationMap) {
    const marketplaceApps = await fetchMarketplaceApps();

    const definitionIds = marketplaceApps
      .map(app => get(app, ['fields', 'extensionDefinitionId'], null))
      .filter(identity);

    const appDefinitionMap = await appDefinitionLoader.getByIds(definitionIds);

    return (
      marketplaceApps
        .map(app => {
          const definitionId = get(app, ['fields', 'extensionDefinitionId']);
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
            categories: get(app, ['fields', 'categories'], [])
              .map(category => get(category, ['fields', 'name'], null))
              .filter(identity),
            description: get(app, ['fields', 'description'], ''),
            appDefinition: appDefinitionMap[definitionId],
            flagId: get(app, ['fields', 'productCatalogFlag', 'fields', 'flagId']),
            icon: get(app, ['fields', 'icon', 'fields', 'file', 'url'], ''),
            id: get(app, ['fields', 'slug'], ''),
            installed: !!installationMap[definitionId],
            links: get(app, ['fields', 'links'], []).map(link => link.fields),
            permissions: `__${title} app__ ${permissionsText}`,
            permissionsExplanation: get(app, ['fields', 'permissionsExplanation']),
            tagLine: get(app, ['fields', 'tagLine'], ''),
            title
          };
        })
        // Filter out - possibly forgotten - broken references in the Apps Listing entry
        .filter(app => !!app.appDefinition)
    );
  }

  async function getDevApps(installationMap) {
    const appDefinitions = await appDefinitionLoader.getAllForCurrentOrganization();

    return appDefinitions.map(def => {
      return {
        appDefinition: def,
        id: [DEV_APP_PREFIX, DEV_APP_SEPARATOR, def.sys.id].join(''),
        title: def.name,
        installed: !!installationMap[def.sys.id],
        isDevApp: true
      };
    });
  }

  function getAppInstallation(appDefinitionId) {
    return spaceEndpoint({
      method: 'GET',
      path: ['app_installations', appDefinitionId]
    });
  }

  async function getAppDefinitionToInstallationMap() {
    const { items } = await spaceEndpoint({
      method: 'GET',
      path: ['app_installations']
    });

    return items.reduce(
      (acc, installation) => ({
        ...acc,
        [installation.sys.appDefinition.sys.id]: installation
      }),
      {}
    );
  }
}
