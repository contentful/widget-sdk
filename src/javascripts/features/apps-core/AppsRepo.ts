import { omit, sortBy } from 'lodash';

import { fetchMarketplaceApps } from './MarketplaceClient';

export function createAppsRepo(cma, appDefinitionLoader) {
  return {
    getApp,
    getApps,
    getOnlyInstalledApps,
  };

  async function getApp(idOrSlug: string) {
    const apps = await getApps();

    const app = apps.find((app) => app.id === idOrSlug || app.appDefinition.sys.id === idOrSlug);

    if (app) {
      return app;
    } else {
      throw new Error(`Could not find an app with ID "${idOrSlug}".`);
    }
  }

  async function getApps() {
    const installationMap = await getAppDefinitionToInstallationMap();
    const [marketplaceApps, orgDefinitions] = await Promise.all([
      fetchMarketplaceApps(),
      appDefinitionLoader.getAllForCurrentOrganization(),
    ]);

    return [
      ...(await getMarketplaceApps(installationMap, marketplaceApps)),
      ...getPrivateApps(installationMap, orgDefinitions),
    ];
  }

  async function getMarketplaceApps(installationMap, marketplaceApps) {
    const definitionIds = marketplaceApps
      // show apps from the marketplace space which are in the public listing or are installed
      .filter((app) => app.isListed || !!installationMap[app.definitionId])
      .map((app) => app.definitionId);
    const appDefinitionMap = await appDefinitionLoader.getByIds(definitionIds);

    return sortBy(
      marketplaceApps.reduce((acc, app) => {
        const { definitionId } = app;
        const appDefinition = appDefinitionMap[definitionId];
        const appInstallation = installationMap[definitionId];

        // Referred definition, for whatever reason, is missing. Skip the app.
        if (!appDefinition) {
          return acc;
        }

        return [...acc, makeMarketplaceAppObject(app, appDefinition, appInstallation)];
      }, []),
      (app) => app.title.toLowerCase()
    );
  }

  function getPrivateApps(installationMap, orgDefinitions) {
    return orgDefinitions.map((def) => {
      return makePrivateAppObject(def, installationMap[def.sys.id]);
    });
  }

  async function getOnlyInstalledApps() {
    const [installationsResponse, marketplaceApps] = await Promise.all([
      cma.getAppInstallations(),
      fetchMarketplaceApps(),
    ]);

    return installationsResponse.items.map((appInstallation) => {
      const definitionId = appInstallation.sys.appDefinition.sys.id;
      const appDefinition = installationsResponse.includes.AppDefinition.find((def) => {
        return def.sys.id === definitionId;
      });
      const marketplaceApp = marketplaceApps.find((app) => {
        return app.definitionId === definitionId;
      });

      if (marketplaceApp) {
        return makeMarketplaceAppObject(marketplaceApp, appDefinition, appInstallation);
      } else {
        return makePrivateAppObject(appDefinition, appInstallation);
      }
    });
  }

  function makeMarketplaceAppObject(marketplaceApp, appDefinition, appInstallation) {
    return {
      ...omit(marketplaceApp, ['definitionId']),
      appDefinition,
      appInstallation,
    };
  }

  function makePrivateAppObject(appDefinition, appInstallation) {
    return {
      id: appDefinition.sys.id,
      title: appDefinition.name,
      appDefinition,
      appInstallation,
      isPrivateApp: true,
      isEarlyAccess: false, // private apps can never be early access
    };
  }

  async function getAppDefinitionToInstallationMap() {
    const { items } = await cma.getAppInstallations();

    return items.reduce(
      (acc, installation) => ({
        ...acc,
        [installation.sys.appDefinition.sys.id]: installation,
      }),
      {}
    );
  }
}