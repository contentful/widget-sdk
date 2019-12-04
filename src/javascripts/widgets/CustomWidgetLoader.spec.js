import { createCustomWidgetLoader } from './CustomWidgetLoader';

const app = {
  appDefinition: {
    sys: {
      id: 'someappdef',
      type: 'AppDefinition'
    },
    name: 'I am app',
    src: 'https://someapp.com',
    public: true,
    locations: ['app', 'entry-sidebar']
  },
  appInstallation: {
    sys: {
      type: 'AppInstallation',
      widgetId: 'iamapp',
      appDefinition: {
        sys: {
          type: 'Link',
          linkType: 'AppDefinition',
          id: 'someappdef'
        }
      }
    },
    parameters: {
      hello: 'world'
    }
  },
  id: 'someappid',
  icon: '//images.ctfassets.net/myappicon.svg',
  title: 'Some app'
};

const expectedAppWidget = {
  fieldTypes: [],
  id: 'iamapp',
  src: 'https://someapp.com',
  isApp: true,
  appId: 'someappid',
  appDefinitionId: 'someappdef',
  appIconUrl: '//images.ctfassets.net/myappicon.svg',
  locations: ['app', 'entry-sidebar'],
  name: 'Some app',
  parameters: [],
  sidebar: false,
  installationParameters: {
    definitions: [],
    values: { hello: 'world' }
  }
};

const uie = {
  sys: { id: 'ext2', srcdocSha256: 'somesha' },
  extension: {
    name: 'Second',
    srcdoc: '<!DOCTYPE html>',
    fieldTypes: [{ type: 'Number' }]
  }
};

const expectedUieWidget = {
  id: 'ext2',
  isApp: false,
  name: 'Second',
  srcdoc: '<!DOCTYPE html>',
  fieldTypes: ['Number'],
  installationParameters: {
    definitions: [],
    values: {}
  },
  parameters: [],
  sidebar: false
};

describe('CustomWidgetLoader', () => {
  describe('#getByIds()', () => {
    it('gets and caches widgets for extensions', async () => {
      const cma = {
        getExtensions: jest.fn(() =>
          Promise.resolve({
            items: [
              {
                sys: { id: 'ext1' },
                extension: {
                  name: 'Hello',
                  src: 'http://hello.com',
                  fieldTypes: [{ type: 'Symbol' }],
                  parameters: {
                    instance: [{ id: 'instance', name: 'Instance param', type: 'Symbol' }],
                    installation: [{ id: 'install', name: 'Installation param', type: 'Symbol' }]
                  }
                },
                parameters: {
                  install: 'test'
                }
              },
              uie
            ]
          })
        )
      };

      const loader = createCustomWidgetLoader(cma);

      const [widget1, widget2] = await loader.getByIds(['ext1', 'ext2', 'non-existent']);

      expect(cma.getExtensions).toBeCalledWith({ 'sys.id[in]': 'ext1,ext2,non-existent' });
      expect([widget1, widget2]).toEqual([
        {
          id: 'ext1',
          name: 'Hello',
          src: 'http://hello.com',
          fieldTypes: ['Symbol'],
          isApp: false,
          installationParameters: {
            definitions: [{ id: 'install', name: 'Installation param', type: 'Symbol' }],
            values: { install: 'test' }
          },
          parameters: [{ id: 'instance', name: 'Instance param', type: 'Symbol' }],
          sidebar: false
        },
        expectedUieWidget
      ]);
      expect(await loader.getByIds(['ext1'])).toEqual([widget1]);
      expect(cma.getExtensions).toBeCalledTimes(1);
    });

    it('gets and caches widgets for apps', async () => {
      const cma = { getExtensions: jest.fn(() => Promise.resolve({ items: [] })) };
      const appsRepo = { getApps: jest.fn(() => Promise.resolve([app])) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const [appWidget] = await loader.getByIds(['non-existent', 'iamapp']);

      expect(cma.getExtensions).toBeCalledWith({ 'sys.id[in]': 'non-existent,iamapp' });
      expect(appsRepo.getApps).toBeCalledTimes(1);
      expect(appWidget).toEqual(expectedAppWidget);
      expect(await loader.getByIds(['iamapp'])).toEqual([appWidget]);
      expect(cma.getExtensions).toBeCalledTimes(1);
      expect(appsRepo.getApps).toBeCalledTimes(1);
    });

    it('recovers from CMA/repo failures', async () => {
      const cma = { getExtensions: jest.fn(() => Promise.reject(new Error())) };
      const appsRepo = { getApps: jest.fn(() => Promise.reject(new Error())) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const widgets = await loader.getByIds(['some', 'ids', 'come', 'inhere']);

      expect(cma.getExtensions).toBeCalledWith({ 'sys.id[in]': 'some,ids,come,inhere' });
      expect(appsRepo.getApps).toBeCalledTimes(1);
      expect(widgets).toEqual([]);
    });
  });

  describe('#evict()', () => {
    it('can be called on not cached or invalid IDs', () => {
      const loader = createCustomWidgetLoader();

      expect.assertions(1);
      try {
        loader.evict('not-cached');
        loader.evict('łódź');
        expect(true).toBe(true);
      } catch (err) {
        expect(true).toBe(false);
      }
    });

    it('clears a cache for an ID', async () => {
      const cma = {
        getExtensions: jest.fn(() => Promise.resolve({ items: [uie] }))
      };

      const loader = createCustomWidgetLoader(cma);

      await loader.getByIds(['ext1']);
      const [widget1] = await loader.getByIds(['ext1']);

      expect(cma.getExtensions).toBeCalledTimes(1);

      loader.evict('ext1');

      const [widget2] = await loader.getByIds(['ext1']);

      expect(widget1).toEqual(widget2);
      expect(cma.getExtensions).toBeCalledTimes(2);
    });
  });

  describe('#getUncachedForListing()', () => {
    it('gets an uncached list of all widgets for listing', async () => {
      const cma = { getExtensionsForListing: jest.fn(() => Promise.resolve({ items: [uie] })) };
      const appsRepo = { getApps: jest.fn(() => Promise.resolve([app])) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const forListing = await loader.getUncachedForListing();

      expect(cma.getExtensionsForListing).toBeCalledTimes(1);
      expect(appsRepo.getApps).toBeCalledTimes(1);
      expect(forListing).toEqual([expectedAppWidget, expectedUieWidget]);

      await loader.getUncachedForListing();

      expect(cma.getExtensionsForListing).toBeCalledTimes(2);
      expect(appsRepo.getApps).toBeCalledTimes(2);
    });

    it('recovers from CMA/repo failures', async () => {
      const cma = { getExtensionsForListing: jest.fn(() => Promise.reject(new Error())) };
      const appsRepo = { getApps: jest.fn(() => Promise.reject(new Error())) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const widgets = await loader.getUncachedForListing();

      expect(cma.getExtensionsForListing).toBeCalledTimes(1);
      expect(appsRepo.getApps).toBeCalledTimes(1);
      expect(widgets).toEqual([]);
    });
  });
});
