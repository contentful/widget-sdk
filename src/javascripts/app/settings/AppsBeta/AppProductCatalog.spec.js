import { AppProductCatalog, getProductCatalogFlagForApp } from './AppProductCatalog.es6';

describe('AppProductCatalog', () => {
  const spaceId = '1234567';

  describe('getProductCatalogFlagForApp', () => {
    it('returns the flag value from the map if flagId is present', async () => {
      const result = getProductCatalogFlagForApp(
        {
          fields: {
            productCatalogFlag: {
              fields: {
                flagId: 'flagId'
              }
            }
          }
        },
        { flagId: false }
      );

      expect(result).toEqual(false);
    });

    it('returns the default value from the map if flagId is not present', async () => {
      const result = getProductCatalogFlagForApp(
        {
          fields: {}
        },
        { flagId: false }
      );

      expect(result).toEqual(true);
    });
  });

  describe('isAppEnabled', () => {
    it('loads the product catalog flag value', async () => {
      const getSpaceFeature = jest.fn().mockReturnValue(Promise.resolve(false));

      const catalog = new AppProductCatalog(spaceId, getSpaceFeature);
      const result = await catalog.isAppEnabled({
        fields: {
          productCatalogFlag: {
            fields: {
              flagId: 'flagId'
            }
          }
        }
      });

      expect(result).toEqual(false);
      expect(getSpaceFeature).toBeCalledWith(spaceId, 'flagId', true);
    });

    it('returns the default value if flagId is not present', async () => {
      const getSpaceFeature = jest.fn();

      const catalog = new AppProductCatalog(spaceId, getSpaceFeature);
      const result = await catalog.isAppEnabled({
        fields: {}
      });

      expect(result).toEqual(true);
      expect(getSpaceFeature).not.toBeCalled();
    });
  });

  describe('loadProductCatalogFlags', () => {
    it('loads the product catalog flags for all apps', async () => {
      const getSpaceFeature = jest.fn().mockReturnValue(Promise.resolve(true));

      const catalog = new AppProductCatalog(spaceId, getSpaceFeature);
      const result = await catalog.loadProductCatalogFlags({
        app1: {
          fields: {
            productCatalogFlag: {
              fields: {
                flagId: 'flagId1'
              }
            }
          }
        },
        app2: {
          fields: {
            productCatalogFlag: {
              fields: {
                flagId: 'flagId2'
              }
            }
          }
        },
        app3: {
          fields: {
            productCatalogFlag: {
              fields: {
                flagId: 'flagId1'
              }
            }
          }
        },
        app4: {
          fields: {}
        }
      });

      expect(result).toEqual({
        flagId1: true,
        flagId2: true
      });

      expect(getSpaceFeature).toBeCalledWith(spaceId, 'flagId1', true);
      expect(getSpaceFeature).toBeCalledWith(spaceId, 'flagId2', true);
    });
  });
});
