import { omit, sortBy } from 'lodash';

import { fetchMarketplaceApps, fetchContentfulApps } from './MarketplaceClient';
import type APIClient from 'data/APIClient';
import { AppDefinition, AppInstallation } from 'contentful-management/types';
import { MarketplaceApp } from './types';

interface AppsRepoCache {
  marketplaceAppDefinitions?: Promise<MarketplaceApp[]>;
  contentfulAppDefinitions?: Promise<MarketplaceApp[]>;
  appInstallations?: Promise<any>;
}

function makePrivateAppObject(
  appDefinition: AppDefinition,
  appInstallation: AppInstallation
): MarketplaceApp {
  return {
    id: appDefinition.sys.id,
    title: appDefinition.name,
    appDefinition,
    appInstallation,
    isPrivateApp: true,
    isEarlyAccess: false, // private apps can never be early access
  };
}

function getPrivateApps(
  installationMap: Record<string, AppInstallation>,
  orgDefinitions
): MarketplaceApp[] {
  return orgDefinitions.map((def) => {
    return makePrivateAppObject(def, installationMap[def.sys.id]);
  });
}

function makeMarketplaceAppObject(
  marketplaceApp: MarketplaceApp,
  appDefinition: AppDefinition,
  appInstallation: AppInstallation
) {
  return {
    ...omit(marketplaceApp, ['definitionId']),
    appDefinition,
    appInstallation,
  };
}

export class AppsRepo {
  cache: AppsRepoCache = {};
  _cacheKey = {};

  private cacheInvalidatedListeners: Set<() => void> = new Set();

  constructor(private cma: APIClient, private appDefinitionLoader) {}

  onCacheInvalidated(listener: () => unknown) {
    const uniqueListener = () => listener();

    // this allows hooks to add a listener to trigger a rerendewr
    this.cacheInvalidatedListeners.add(uniqueListener);
    return () => this.cacheInvalidatedListeners.delete(uniqueListener);
  }

  clearCache(fields = Object.keys(this.cache) as (keyof AppsRepoCache)[]) {
    fields.forEach((field) => delete this.cache[field]);
    // this is needed for hooks to compare invalidate memos when they render
    this._cacheKey = {};
    this.cacheInvalidatedListeners.forEach((callback) => callback());
  }

  getAppByIdOrSlug = async (idOrSlug: string): Promise<MarketplaceApp> => {
    const apps = await this.getAllApps();

    const app = apps.find((app) => app.id === idOrSlug || app.appDefinition.sys.id === idOrSlug);
    if (app) {
      return app;
    }

    throw new Error(`Could not find an app with ID "${idOrSlug}".`);
  };

  getAllApps = async (): Promise<MarketplaceApp[]> => {
    const orgDefinitions = await this.appDefinitionLoader.getAllForCurrentOrganization();

    const [installationMap, resolvedMarketplaceApps, resolvedContentfulApps] = await Promise.all([
      this.getAppDefinitionToInstallationMap(),
      this.getMarketplaceApps(),
      this.getContentfulApps(),
    ]);

    return [
      ...resolvedContentfulApps,
      ...resolvedMarketplaceApps,
      ...getPrivateApps(installationMap, orgDefinitions),
    ];
  };

  async getContentfulApps(): Promise<MarketplaceApp[]> {
    const [installationMap, fetchedApps] = await Promise.all([
      this.getAppDefinitionToInstallationMap(),
      this.getContentfulAppDefinitions(),
    ]);
    const ctfAppDefs = await this.appDefinitionLoader.getByIds(
      fetchedApps?.map((c) => c.definitionId)
    );

    return sortBy(
      fetchedApps
        ?.map((app) => ({
          ...app,
          appDefinition: ctfAppDefs[app.definitionId!],
          appInstallation: installationMap[app.definitionId!],
        }))
        .filter((app) => app.appDefinition),
      (ctflApp) => ctflApp.title.toLowerCase()
    );
  }

  getOnlyInstalledApps = async (): Promise<MarketplaceApp[]> => {
    const [appInstallations, marketplaceApps, contentfulApps] = await Promise.all([
      this.getAppInstallations(),
      this.getMarketplaceAppDefinitions(),
      this.getContentfulAppDefinitions(),
    ]);
    const availableApps = marketplaceApps.concat(contentfulApps);

    return appInstallations.items.map((appInstallation) => {
      const definitionId = appInstallation.sys.appDefinition.sys.id;
      const appDefinition = appInstallations.includes.AppDefinition.find((def) => {
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
  };

  private getCachedOrCreate<Key extends keyof AppsRepoCache>(
    key: Key,
    getNewValue: () => AppsRepoCache[Key]
  ) {
    const cachedValue = this.cache[key];

    if (cachedValue) return cachedValue!;

    const newValue = getNewValue();
    this.cache[key] = newValue;

    return newValue!;
  }

  private async getMarketplaceAppDefinitions() {
    return this.getCachedOrCreate('marketplaceAppDefinitions', fetchMarketplaceApps);
  }

  private async getContentfulAppDefinitions() {
    return this.getCachedOrCreate('contentfulAppDefinitions', fetchContentfulApps);
  }

  private async getAppInstallations() {
    return this.getCachedOrCreate('appInstallations', () => this.cma.getAppInstallations());
  }

  private async getMarketplaceApps(): Promise<MarketplaceApp[]> {
    const [installationMap, fetchedApps] = await Promise.all([
      this.getAppDefinitionToInstallationMap(),
      this.getMarketplaceAppDefinitions(),
    ]);
    const definitionIds = fetchedApps
      // show apps from the marketplace space which are in the public listing or are installed
      .filter((app) => app.isListed || !!installationMap[app.definitionId!])
      .map((app) => app.definitionId);
    const appDefinitionMap = await this.appDefinitionLoader.getByIds(definitionIds);

    return sortBy(
      fetchedApps.reduce((acc, app) => {
        const definitionId = app.definitionId!;
        const appDefinition = appDefinitionMap[definitionId];
        const appInstallation = installationMap[definitionId];

        // Referred definition, for whatever reason, is missing. Skip the app.
        if (!appDefinition) {
          return acc;
        }

        return [...acc, makeMarketplaceAppObject(app, appDefinition, appInstallation)];
      }, [] as MarketplaceApp[]),
      (app) => app.title.toLowerCase()
    );
  }

  private async getAppDefinitionToInstallationMap() {
    const { items } = await this.getAppInstallations();

    return items.reduce(
      (acc, installation) => ({
        ...acc,
        [installation.sys.appDefinition.sys.id]: installation,
      }),
      {}
    );
  }
}
