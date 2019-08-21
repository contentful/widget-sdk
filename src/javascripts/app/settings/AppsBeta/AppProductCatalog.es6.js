import { get, uniq, identity } from 'lodash';

const APP_PRODUCT_CATALOG_FLAG_PATH = 'fields.productCatalogFlag.fields.flagId';
const DEFAULT_STATUS = true;

export const getProductCatalogFlagForApp = (app, productCatalogFlags) => {
  const flagId = get(app, APP_PRODUCT_CATALOG_FLAG_PATH);
  return typeof flagId === 'undefined' ? DEFAULT_STATUS : productCatalogFlags[flagId];
};

export class AppProductCatalog {
  constructor(spaceId, getSpaceFeature) {
    this.getSpaceFeature = getSpaceFeature;
    this.spaceId = spaceId;
  }

  isAppEnabled(app) {
    const flagId = get(app, APP_PRODUCT_CATALOG_FLAG_PATH);

    if (typeof flagId === 'undefined') {
      return DEFAULT_STATUS;
    }

    return this.getSpaceFeature(this.spaceId, flagId, DEFAULT_STATUS);
  }

  async loadProductCatalogFlags(apps) {
    const flagsToLoad = uniq(
      Object.keys(apps)
        .map(key => get(apps[key], APP_PRODUCT_CATALOG_FLAG_PATH))
        .filter(identity)
    );

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
