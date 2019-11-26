import { get, identity } from 'lodash';

import { fetchMarketplaceApps } from './MarketplaceClient';
import { hasAllowedAppFeatureFlag } from './AppProductCatalog';

export default function createAppsRepo(appDefinitionLoader, spaceEndpoint) {
  return {
    getApps,
    getAppInstallation
  };

  async function getApps() {
    const installationMap = await getAppDefinitionToInstallationMap();

    const [marketplaceApps, privateApps] = await Promise.all([
      getMarketplaceApps(installationMap),
      getPrivateApps(installationMap)
    ]);

    return [...marketplaceApps, ...privateApps].filter(hasAllowedAppFeatureFlag);
  }

  async function getMarketplaceApps(installationMap) {
    const marketplaceApps = await fetchMarketplaceApps();

    const definitionIds = marketplaceApps
      .map(app => get(app, ['fields', 'appDefinitionId'], null))
      .filter(identity);

    const appDefinitionMap = await appDefinitionLoader.getByIds(definitionIds);

    return (
      marketplaceApps
        .map(app => {
          const definitionId = get(app, ['fields', 'appDefinitionId']);
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

  async function getPrivateApps(installationMap) {
    const appDefinitions = await appDefinitionLoader.getAllForCurrentOrganization();

    return appDefinitions.map(def => {
      return {
        appDefinition: def,
        id: `private_${def.sys.id}`,
        title: def.name,
        installed: !!installationMap[def.sys.id],
        isPrivateApp: true
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
