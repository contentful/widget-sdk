import { omit, sortBy } from 'lodash';

import { fetchMarketplaceApps, fetchContentfulApps } from './MarketplaceClient';

interface Link {
  title: string;
  shortTitle: string;
  url: string;
}

export interface MarketplaceApp {
  id: string;
  title: string;
  tagLine?: string;
  icon?: string;
  appInstallation?: object;
  appDefinition: {
    sys: {
      type: 'AppDefinition';
      id: string;
      organization: {
        sys: {
          id: string;
          [key: string]: any;
        };
      };
      [key: string]: any;
    };
    [key: string]: any;
  };
  isPrivateApp?: boolean;
  isEarlyAccess: boolean;
  isListed?: boolean;
  author?: {
    name: string;
    url: string;
    icon: string;
  };
  categories?: string[];
  description?: string;
  links?: Link[];
  legal?: { eula: string; privacyPolicy: string };
  actionList?: { negative: boolean; info: string }[];
  documentationLink?: Link;
  featureFlagName?: string | null;
  supportUrl?: string;
  isContentfulApp?: boolean;
}

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
    }

    throw new Error(`Could not find an app with ID "${idOrSlug}".`);
  }

  async function getApps() {
    const [installationMap, marketplaceApps, contentfulApps, orgDefinitions] = await Promise.all([
      getAppDefinitionToInstallationMap(),
      fetchMarketplaceApps(),
      fetchContentfulApps(),
      appDefinitionLoader.getAllForCurrentOrganization(),
    ]);

    const [resolvedMarketplaceApps, resolvedContentfulApps] = await Promise.all([
      getMarketplaceApps(installationMap, marketplaceApps),
      getContentfulApps(installationMap, contentfulApps),
    ]);

    return [
      ...resolvedContentfulApps,
      ...resolvedMarketplaceApps,
      ...getPrivateApps(installationMap, orgDefinitions),
    ];
  }

  async function getContentfulApps(installationMap, contentfulApps) {
    const ctflAppDefs = await appDefinitionLoader.getByIds(
      contentfulApps.map((c) => c.definitionId)
    );
    return sortBy(
      contentfulApps
        .map((app) => ({
          ...app,
          appDefinition: ctflAppDefs[app.definitionId],
          appInstallation: installationMap[app.definitionId],
        }))
        .filter((app) => app.appDefinition),
      (ctflApp) => ctflApp.title.toLowerCase()
    );
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
    const [installationsResponse, marketplaceApps, contentfulApps] = await Promise.all([
      cma.getAppInstallations(),
      fetchMarketplaceApps(),
      fetchContentfulApps(),
    ]);
    const availableApps = marketplaceApps.concat(contentfulApps);

    return installationsResponse.items.map((appInstallation) => {
      const definitionId = appInstallation.sys.appDefinition.sys.id;
      const appDefinition = installationsResponse.includes.AppDefinition.find((def) => {
        return def.sys.id === definitionId;
      });
      const marketplaceApp = availableApps.find((app) => {
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
