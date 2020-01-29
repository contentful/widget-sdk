import { createCustomWidgetLoader } from './CustomWidgetLoader';
import {
  NAMESPACE_BUILTIN,
  NAMESPACE_EXTENSION,
  NAMESPACE_SIDEBAR_BUILTIN,
  NAMESPACE_APP
} from './WidgetNamespaces';
import { LOCATION_ENTRY_FIELD } from './WidgetLocations';

const app = {
  appDefinition: {
    sys: {
      id: 'some-app',
      type: 'AppDefinition'
    },
    name: 'I am app',
    src: 'https://someapp.com',
    locations: [
      {
        location: LOCATION_ENTRY_FIELD,
        fieldTypes: [{ type: 'Symbol' }]
      }
    ],
    public: true
  },
  appInstallation: {
    sys: {
      type: 'AppInstallation',
      widgetId: 'some-widget-id',
      appDefinition: {
        sys: {
          type: 'Link',
          linkType: 'AppDefinition',
          id: 'some-app'
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
  id: 'some-app',
  appDefinitionId: 'some-app',
  namespace: NAMESPACE_APP,
  src: 'https://someapp.com',
  fieldTypes: ['Symbol'],
  locations: [LOCATION_ENTRY_FIELD],
  appId: 'someappid',
  appIconUrl: '//images.ctfassets.net/myappicon.svg',
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
  describe('#getByKeys()', () => {
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

      const [widget1, widget2] = await loader.getByKeys([
        [NAMESPACE_EXTENSION, 'ext1'],
        [NAMESPACE_EXTENSION, 'ext2'],
        [NAMESPACE_EXTENSION, 'non-existent']
      ]);

      expect(cma.getExtensions).toBeCalledWith({ 'sys.id[in]': 'ext1,ext2,non-existent' });
      expect([widget1, widget2]).toEqual([
        {
          id: 'ext1',
          namespace: NAMESPACE_EXTENSION,
          name: 'Hello',
          src: 'http://hello.com',
          fieldTypes: ['Symbol'],
          installationParameters: {
            definitions: [{ id: 'install', name: 'Installation param', type: 'Symbol' }],
            values: { install: 'test' }
          },
          parameters: [{ id: 'instance', name: 'Instance param', type: 'Symbol' }],
          sidebar: false
        },
        expectedUieWidget
      ]);
      expect(await loader.getByKeys([[NAMESPACE_EXTENSION, 'ext1']])).toEqual([widget1]);
      expect(cma.getExtensions).toBeCalledTimes(1);
    });

    it('gets and caches widgets for apps', async () => {
      const cma = { getExtensions: jest.fn() };
      const appsRepo = { getOnlyInstalledApps: jest.fn(() => Promise.resolve([app])) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const [appWidget] = await loader.getByKeys([
        [NAMESPACE_APP, 'non-existent'],
        [NAMESPACE_APP, 'some-app']
      ]);

      expect(cma.getExtensions).not.toBeCalled();
      expect(appsRepo.getOnlyInstalledApps).toBeCalledTimes(1);
      expect(appWidget).toEqual(expectedAppWidget);

      expect(await loader.getByKeys([[NAMESPACE_APP, 'some-app']])).toEqual([appWidget]);
      expect(cma.getExtensions).not.toBeCalled();
      expect(appsRepo.getOnlyInstalledApps).toBeCalledTimes(1);
    });

    it('recovers from CMA/repo failures', async () => {
      const cma = { getExtensions: jest.fn(() => Promise.reject(new Error())) };
      const appsRepo = { getOnlyInstalledApps: jest.fn(() => Promise.reject(new Error())) };

      const loader = createCustomWidgetLoader(cma, appsRepo);

      const widgets = await loader.getByKeys([
        [NAMESPACE_EXTENSION, 'some'],
        [NAMESPACE_EXTENSION, 'ids'],
        [NAMESPACE_EXTENSION, 'come'],
        [NAMESPACE_EXTENSION, 'inhere'],
        [NAMESPACE_APP, 'someapp']
      ]);

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
          { widgetId: 'some-app', widgetNamespace: NAMESPACE_APP }
        ],
        sidebar: [
          { widgetId: 'publish-widget', widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN },
          { widgetId: 'sidebar-extension', widgetNamespace: NAMESPACE_EXTENSION }
        ]
      });

      expect(cma.getExtensions).toHaveBeenCalledTimes(1);
      expect(cma.getExtensions).toHaveBeenCalledWith({
        'sys.id[in]': 'extension1,sidebar-extension'
      });
      expect(appsRepo.getOnlyInstalledApps).toHaveBeenCalledTimes(1);

      const expectedWidgetIds = ['extension1', 'some-app', 'sidebar-extension'];
      expect(widgets.map(w => w.id).sort()).toEqual(expectedWidgetIds.sort());
    });
  });

  describe('#evict()', () => {
    it('can be called on not cached or invalid keys', () => {
      const loader = createCustomWidgetLoader();

      expect.assertions(1);
      try {
        loader.evict([NAMESPACE_EXTENSION, 'not-cached']);
        loader.evict([NAMESPACE_APP, 'łódź']);
        loader.evict(['wtf-namespace', 'hello']);
        expect(true).toBe(true);
      } catch (err) {
        expect(true).toBe(false);
      }
    });

    it('clears a cache for a key', async () => {
      const cma = { getExtensions: jest.fn(() => Promise.resolve({ items: [uie] })) };
      const appsRepo = { getOnlyInstalledApps: jest.fn(() => Promise.resolve([])) };

      const loader = createCustomWidgetLoader(cma, appsRepo);
      const key = [NAMESPACE_EXTENSION, 'ext1'];

      await loader.getByKeys([key]);
      const [widget1] = await loader.getByKeys([key]);

      expect(cma.getExtensions).toBeCalledTimes(1);

      loader.evict(key);

      const [widget2] = await loader.getByKeys([key]);

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
