import { AppProductCatalog } from './AppProductCatalog';

describe('AppProductCatalog', () => {
  const spaceId = '1234567';

  describe('isAppEnabled', () => {
    it('loads the product catalog flag value', async () => {
      const getSpaceFeature = jest.fn().mockReturnValue(Promise.resolve(false));

      const catalog = new AppProductCatalog(spaceId, getSpaceFeature);
      const result = await catalog.isAppEnabled({ premium: true });

      expect(result).toEqual(false);
      expect(getSpaceFeature).toBeCalledWith(spaceId, 'optimizely_app', true);
    });

    it('returns the value for the default flag if the app is not premium', async () => {
      const getSpaceFeature = jest.fn().mockReturnValue(Promise.resolve(false));

      const catalog = new AppProductCatalog(spaceId, getSpaceFeature);
      const result = await catalog.isAppEnabled({});

      expect(result).toEqual(false);
      expect(getSpaceFeature).toBeCalledWith(spaceId, 'basic_apps', true);
    });
  });
});
