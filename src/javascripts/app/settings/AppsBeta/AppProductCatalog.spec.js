import { AppProductCatalog, getProductCatalogFlagForApp } from './AppProductCatalog';

describe('AppProductCatalog', () => {
  const spaceId = '1234567';

  describe('getProductCatalogFlagForApp', () => {
    it('returns the flag value from the map if flagId is present and allowed', async () => {
      const result = getProductCatalogFlagForApp(
        { flagId: 'optimizely_app' },
        { optimizely_app: false }
      );

      expect(result).toEqual(false);
    });

    it('uses the default flagId and value from the map if flagId is not present on app', async () => {
      const result = getProductCatalogFlagForApp({}, { basic_apps: false });

      expect(result).toEqual(false);
    });

    it('uses the default flagId and value from the map if flagId not allowed', async () => {
      const result = getProductCatalogFlagForApp({ flagId: 'unknown' }, { basic_apps: false });

      expect(result).toEqual(false);
    });
  });

  describe('isAppEnabled', () => {
    it('loads the product catalog flag value', async () => {
      const getSpaceFeature = jest.fn().mockReturnValue(Promise.resolve(false));

      const catalog = new AppProductCatalog(spaceId, getSpaceFeature);
      const result = await catalog.isAppEnabled({ flagId: 'optimizely_app' });

      expect(result).toEqual(false);
      expect(getSpaceFeature).toBeCalledWith(spaceId, 'optimizely_app', true);
    });

    it('returns the value for the default flag if no flagId is present on app', async () => {
      const getSpaceFeature = jest.fn().mockReturnValue(Promise.resolve(false));

      const catalog = new AppProductCatalog(spaceId, getSpaceFeature);
      const result = await catalog.isAppEnabled({});

      expect(result).toEqual(false);
      expect(getSpaceFeature).toBeCalledWith(spaceId, 'basic_apps', true);
    });
  });

  describe('loadProductCatalogFlags', () => {
    it('loads the product catalog flags for all apps', async () => {
      const getSpaceFeature = jest.fn().mockReturnValue(Promise.resolve(true));

      const catalog = new AppProductCatalog(spaceId, getSpaceFeature);
      const result = await catalog.loadProductCatalogFlags([
        { flagId: 'optimizely_app' },
        { flagId: 'unknownFlagId' },
        { flagId: 'optimizely_app' },
        {}
      ]);

      expect(result).toEqual({
        optimizely_app: true,
        basic_apps: true
      });

      expect(getSpaceFeature).toBeCalledWith(spaceId, 'optimizely_app', true);
      expect(getSpaceFeature).toBeCalledWith(spaceId, 'basic_apps', true);
    });
  });
});
