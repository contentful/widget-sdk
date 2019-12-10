import { omit } from 'lodash';

import { fetchMarketplaceApps } from './MarketplaceClient';
import { hasAllowedAppFeatureFlag } from './AppProductCatalog';

export default function createAppsRepo(cma, appDefinitionLoader) {
  return {
    getApp,
    getApps
  };

  async function getApp(id) {
    const apps = await getApps();
    const app = apps.find(app => app.id === id);

    if (app) {
      return app;
    } else {
      throw new Error(`Could not find an app with ID "${id}".`);
    }
  }

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
    const definitionIds = marketplaceApps.map(app => app.definitionId);
    const appDefinitionMap = await appDefinitionLoader.getByIds(definitionIds);

    return marketplaceApps.reduce((acc, app) => {
      const { definitionId } = app;
      const appDefinition = appDefinitionMap[definitionId];

      // Referred definition, for whatever reason, is missing. Skip the app.
      if (!appDefinition) {
        return acc;
      }

      return [
        ...acc,
        // Enrich marketplace data with definition and installation entities.
        {
          ...omit(app, ['definitionId']),
          appDefinition,
          appInstallation: installationMap[definitionId]
        }
      ];
    }, []);
  }

  async function getPrivateApps(installationMap) {
    const appDefinitions = await appDefinitionLoader.getAllForCurrentOrganization();

    return appDefinitions.map(def => {
      return {
        appDefinition: def,
        id: `private_${def.sys.id}`,
        title: def.name,
        appInstallation: installationMap[def.sys.id],
        isPrivateApp: true
      };
    });
  }

  async function getAppDefinitionToInstallationMap() {
    const { items } = await cma.getAppInstallations();

    return items.reduce(
      (acc, installation) => ({
        ...acc,
        [installation.sys.appDefinition.sys.id]: installation
      }),
      {}
    );
  }
}
