// TODO: rename underlying feature keys.
const APPS_PLATFORM_KEY = 'basic_apps';
const PREMIUM_APPS_KEY = 'optimizely_app';

// Fail open.
const DEFAULT_STATUS = true;

export class AppProductCatalog {
  constructor(spaceId, getSpaceFeature) {
    this.getSpaceFeature = getSpaceFeature.bind(this, spaceId);
  }

  isAppEnabled(appDefinition) {
    const featureKey = appDefinition.premium ? PREMIUM_APPS_KEY : APPS_PLATFORM_KEY;

    try {
      return this.getSpaceFeature(featureKey, DEFAULT_STATUS);
    } catch (err) {
      return DEFAULT_STATUS;
    }
  }
}
