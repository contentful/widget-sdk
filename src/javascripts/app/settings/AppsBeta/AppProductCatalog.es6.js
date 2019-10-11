import { get, uniq } from 'lodash';

const DEFAULT_STATUS = true;
const DEFAULT_FLAG_ID = 'basic_apps';

/**
 *  Required as a safety check since the product catalog will
 *  respond with 404 for all flags if we request a unknown flag id.
 */
const ALLOWED_FLAG_IDS = ['basic_apps', 'optimizely_app'];

const getFlagId = app => {
  const flagId = get(app, ['flagId'], DEFAULT_FLAG_ID);

  if (!ALLOWED_FLAG_IDS.includes(flagId)) {
    return DEFAULT_FLAG_ID;
  }

  return flagId;
};

export const getProductCatalogFlagForApp = (app, productCatalogFlags) => {
  const flagId = getFlagId(app);
  return typeof productCatalogFlags[flagId] === 'undefined'
    ? DEFAULT_STATUS
    : productCatalogFlags[flagId];
};

export const hasAllowedAppFeatureFlag = app =>
  ALLOWED_FLAG_IDS.includes(app.flagId || DEFAULT_FLAG_ID);

export class AppProductCatalog {
  constructor(spaceId, getSpaceFeature) {
    this.getSpaceFeature = getSpaceFeature;
    this.spaceId = spaceId;
  }

  async isAppsFeatureDisabled() {
    try {
      const flagValue = await this.getSpaceFeature(this.spaceId, DEFAULT_FLAG_ID, DEFAULT_STATUS);
      return !flagValue;
    } catch (err) {
      return DEFAULT_STATUS;
    }
  }

  isAppEnabled(app) {
    const flagId = getFlagId(app);

    try {
      return this.getSpaceFeature(this.spaceId, flagId, DEFAULT_STATUS);
    } catch (err) {
      return DEFAULT_STATUS;
    }
  }

  async loadProductCatalogFlags(marketplaceApps) {
    const flagsToLoad = uniq(marketplaceApps.map(app => getFlagId(app)));

    const productCatalogFlags = await Promise.all(
      flagsToLoad.map(async feature => ({
        feature,
        value: await this.getSpaceFeature(this.spaceId, feature, DEFAULT_STATUS)
      }))
    );

    return productCatalogFlags.reduce(
      (acc, { feature, value }) => ({ ...acc, [feature]: value }),
      {}
    );
  }
}
