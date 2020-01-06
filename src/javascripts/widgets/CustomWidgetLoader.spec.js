import { createCustomWidgetLoader } from './CustomWidgetLoader';
import {
  NAMESPACE_BUILTIN,
  NAMESPACE_EXTENSION,
  NAMESPACE_SIDEBAR_BUILTIN
} from './WidgetNamespaces';

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
  namespace: NAMESPACE_EXTENSION,
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
  namespace: NAMESPACE_EXTENSION,
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
      const appsRepo = { getOnlyInstalledApps: jest.fn(() => Promise.resolve([])) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const [widget1, widget2] = await loader.getByIds(['ext1', 'ext2', 'non-existent']);

      expect(cma.getExtensions).toBeCalledWith({ 'sys.id[in]': 'ext1,ext2,non-existent' });
      expect([widget1, widget2]).toEqual([
        {
          id: 'ext1',
          namespace: NAMESPACE_EXTENSION,
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
      const appsRepo = { getOnlyInstalledApps: jest.fn(() => Promise.resolve([app])) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const [appWidget] = await loader.getByIds(['non-existent', 'iamapp']);

      expect(cma.getExtensions).toBeCalledWith({ 'sys.id[in]': 'non-existent,iamapp' });
      expect(appsRepo.getOnlyInstalledApps).toBeCalledTimes(1);
      expect(appWidget).toEqual(expectedAppWidget);
      expect(await loader.getByIds(['iamapp'])).toEqual([appWidget]);
      expect(cma.getExtensions).toBeCalledTimes(1);
      expect(appsRepo.getOnlyInstalledApps).toBeCalledTimes(1);
    });

    it('recovers from CMA/repo failures', async () => {
      const cma = { getExtensions: jest.fn(() => Promise.reject(new Error())) };
      const appsRepo = { getOnlyInstalledApps: jest.fn(() => Promise.reject(new Error())) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const widgets = await loader.getByIds(['some', 'ids', 'come', 'inhere']);

      expect(cma.getExtensions).toBeCalledWith({ 'sys.id[in]': 'some,ids,come,inhere' });
      expect(appsRepo.getOnlyInstalledApps).toBeCalledTimes(1);
      expect(widgets).toEqual([]);
    });
  });

  describe('#getForEditor()', () => {
    it('handles lack of editor interface', async () => {
      const cma = { getExtensions: jest.fn(() => Promise.resolve({ items: [] })) };
      const appsRepo = { getOnlyInstalledApps: jest.fn(() => Promise.resolve([])) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const widgets = await loader.getForEditor();

      expect(cma.getExtensions).not.toHaveBeenCalled();
      expect(appsRepo.getOnlyInstalledApps).not.toHaveBeenCalled();
      expect(widgets).toEqual([]);
    });

    it('does not load custom widgets when only builtins are used', async () => {
      const cma = { getExtensions: jest.fn(() => Promise.resolve({ items: [] })) };
      const appsRepo = { getOnlyInstalledApps: jest.fn(() => Promise.resolve([])) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const widgets = await loader.getForEditor({
        controls: [{ widgetId: 'singleLine', widgetNamespace: NAMESPACE_BUILTIN }],
        sidebar: [{ widgetId: 'publish-widget', widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN }]
      });

      expect(cma.getExtensions).not.toHaveBeenCalled();
      expect(appsRepo.getOnlyInstalledApps).not.toHaveBeenCalled();
      expect(widgets).toEqual([]);
    });

    it('loads custom widgets if needed', async () => {
      const cma = {
        getExtensions: jest.fn(() =>
          Promise.resolve({
            items: [
              { sys: { id: 'extension1', type: 'Extension' }, extension: { src: 'x' } },
              { sys: { id: 'sidebar-extension', type: 'Extension' }, extension: { src: 'y' } }
            ]
          })
        )
      };
      const appsRepo = { getOnlyInstalledApps: jest.fn(() => Promise.resolve([app])) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const widgets = await loader.getForEditor({
        controls: [
          { widgetId: 'singleLine', widgetNamespace: NAMESPACE_BUILTIN },
          { widgetId: 'extension1', widgetNamespace: NAMESPACE_EXTENSION },
          { widgetId: 'jsonEditor', widgetNamespace: NAMESPACE_BUILTIN },
          { widgetId: 'iamapp', widgetNamespace: NAMESPACE_EXTENSION }
        ],
        sidebar: [
          { widgetId: 'publish-widget', widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN },
          { widgetId: 'sidebar-extension', widgetNamespace: NAMESPACE_EXTENSION }
        ]
      });

      expect(cma.getExtensions).toHaveBeenCalledTimes(1);
      expect(cma.getExtensions).toHaveBeenCalledWith({
        'sys.id[in]': 'extension1,iamapp,sidebar-extension'
      });
      expect(appsRepo.getOnlyInstalledApps).toHaveBeenCalledTimes(1);

      const expectedWidgetIds = ['extension1', 'iamapp', 'sidebar-extension'];
      expect(widgets.map(w => w.id).sort()).toEqual(expectedWidgetIds.sort());
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
      const cma = { getExtensions: jest.fn(() => Promise.resolve({ items: [uie] })) };
      const appsRepo = { getOnlyInstalledApps: jest.fn(() => Promise.resolve([])) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

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
      const appsRepo = { getOnlyInstalledApps: jest.fn(() => Promise.resolve([app])) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const forListing = await loader.getUncachedForListing();

      expect(cma.getExtensionsForListing).toBeCalledTimes(1);
      expect(appsRepo.getOnlyInstalledApps).toBeCalledTimes(1);
      expect(forListing).toEqual([expectedAppWidget, expectedUieWidget]);

      await loader.getUncachedForListing();

      expect(cma.getExtensionsForListing).toBeCalledTimes(2);
      expect(appsRepo.getOnlyInstalledApps).toBeCalledTimes(2);
    });

    it('recovers from CMA/repo failures', async () => {
      const cma = { getExtensionsForListing: jest.fn(() => Promise.reject(new Error())) };
      const appsRepo = { getOnlyInstalledApps: jest.fn(() => Promise.reject(new Error())) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const widgets = await loader.getUncachedForListing();

      expect(cma.getExtensionsForListing).toBeCalledTimes(1);
      expect(appsRepo.getOnlyInstalledApps).toBeCalledTimes(1);
      expect(widgets).toEqual([]);
    });
  });
});
