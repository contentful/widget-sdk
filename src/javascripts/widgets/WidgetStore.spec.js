import { omit } from 'lodash';

import * as WidgetStore from './WidgetStore';
import { create as createBuiltinWidgetList } from './BuiltinWidgets';
import {
  NAMESPACE_BUILTIN,
  NAMESPACE_EXTENSION,
  NAMESPACE_SIDEBAR_BUILTIN
} from './WidgetNamespaces';

jest.mock('./BuiltinWidgets', () => ({
  create: () => []
}));

describe('WidgetStore', () => {
  let cmaMock;
  let loaderMock;
  let appsRepoMock;

  beforeEach(() => {
    cmaMock = { getExtensionsForListing: jest.fn() };
    loaderMock = { getExtensionsById: jest.fn() };
    appsRepoMock = { getApps: jest.fn() };
  });

  describe('#getBuiltinsOnly()', () => {
    it('returns only builtins', () => {
      const widgets = WidgetStore.getBuiltinsOnly();
      expect(widgets[NAMESPACE_EXTENSION]).toBeUndefined();
      expect(widgets[NAMESPACE_BUILTIN].map(w => w.id)).toEqual(
        createBuiltinWidgetList().map(b => b.id)
      );
    });
  });

  describe('#getForContentTypeManagement()', () => {
    it('returns an object of all widget namespaces', async () => {
      cmaMock.getExtensionsForListing.mockResolvedValueOnce({ items: [] });
      appsRepoMock.getApps.mockImplementationOnce(() => Promise.resolve([]));

      const widgets = await WidgetStore.getForContentTypeManagement(cmaMock, appsRepoMock);

      expect(cmaMock.getExtensionsForListing).toHaveBeenCalledTimes(1);
      expect(widgets[NAMESPACE_EXTENSION]).toEqual([]);
      expect(widgets[NAMESPACE_BUILTIN].map(w => w.id)).toEqual(
        createBuiltinWidgetList().map(b => b.id)
      );
    });

    it('includes processed extensions from API', async () => {
      const entity = {
        sys: { id: 'my-extension' },
        extension: {
          name: 'NAME',
          src: 'SRC',
          sidebar: true,
          fieldTypes: [{ type: 'Array', items: { type: 'Link', linkType: 'Asset' } }],
          parameters: {
            instance: [{ id: 'x' }],
            installation: [{ id: 'test' }]
          }
        },
        parameters: { test: true }
      };

      cmaMock.getExtensionsForListing.mockResolvedValueOnce({
        items: [
          entity,
          {
            ...entity,
            sys: { id: 'srcdoc-extension', srcdocSha256: 'somecodesha' },
            extension: omit(entity.extension, ['src'])
          }
        ]
      });

      appsRepoMock.getApps.mockResolvedValueOnce([
        {
          id: 'app-not-installed',
          title: 'Not installed app',
          appDefinition: { id: 'some-app-id' }
        },
        {
          id: 'app-id',
          title: 'Test App',
          appDefinition: {
            sys: { id: 'app-definition-id' },
            src: 'http://localhost:1234',
            name: 'Test Definition Name',
            fieldTypes: [{ type: 'Array', items: { type: 'Link', linkType: 'Entry' } }],
            locations: ['APP']
          },
          appInstallation: {
            sys: { widgetId: 'some-app-widget' },
            parameters: { test: true }
          }
        }
      ]);

      const widgets = await WidgetStore.getForContentTypeManagement(cmaMock, appsRepoMock);
      const namespaceWidgets = widgets[NAMESPACE_EXTENSION];

      expect(namespaceWidgets).toHaveLength(3);

      const [srcWidget, srcdocWidget, appWidget] = namespaceWidgets;

      expect(cmaMock.getExtensionsForListing).toHaveBeenCalledTimes(1);
      expect(appsRepoMock.getApps).toHaveBeenCalledTimes(1);

      expect(srcWidget.id).toEqual('my-extension');
      expect(srcWidget.isApp).toBe(false);
      expect(srcWidget.appId).toBeUndefined();
      expect(srcWidget.appDefinitionId).toBeUndefined();
      expect(srcWidget.name).toEqual('NAME');
      expect(srcWidget.src).toEqual('SRC');
      expect(srcWidget.sidebar).toEqual(true);
      expect(srcWidget.fieldTypes).toEqual(['Assets']);
      expect(srcWidget.parameters).toEqual([{ id: 'x' }]);
      expect(srcWidget.installationParameters).toEqual({
        definitions: [{ id: 'test' }],
        values: { test: true }
      });

      expect(srcdocWidget.id).toEqual('srcdoc-extension');
      expect(srcdocWidget.isApp).toBe(false);
      expect(srcdocWidget.appId).toBeUndefined();
      expect(srcdocWidget.appDefinitionId).toBeUndefined();
      expect(srcdocWidget.src).toBeUndefined();
      expect(srcdocWidget.srcdoc).toEqual(true);

      expect(appWidget.id).toEqual('some-app-widget');
      expect(appWidget.isApp).toEqual(true);
      expect(appWidget.appId).toEqual('app-id');
      expect(appWidget.appDefinitionId).toEqual('app-definition-id');
      expect(appWidget.name).toEqual('Test App');
      expect(appWidget.src).toEqual('http://localhost:1234');
      expect(appWidget.fieldTypes).toEqual(['Entries']);
      expect(appWidget.locations).toEqual(['APP']);
      expect(appWidget.installationParameters.values).toEqual({ test: true });
    });
  });

  describe('#getForEditor()', () => {
    it('handles lack of editor interface', async () => {
      loaderMock.getExtensionsById.mockImplementationOnce(() => []);

      const widgets = await WidgetStore.getForEditor(loaderMock);

      expect(loaderMock.getExtensionsById).toHaveBeenCalledWith([]);
      expect(widgets[NAMESPACE_EXTENSION]).toEqual([]);
    });

    it('does not load extensions when only builtins are used', async () => {
      loaderMock.getExtensionsById.mockImplementationOnce(() => []);

      const widgets = await WidgetStore.getForEditor(loaderMock, {
        controls: [{ widgetId: 'singleLine', widgetNamespace: NAMESPACE_BUILTIN }],
        sidebar: [{ widgetId: 'publish-widget', widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN }]
      });

      expect(loaderMock.getExtensionsById).toHaveBeenCalledWith([]);
      expect(widgets[NAMESPACE_EXTENSION]).toEqual([]);
    });

    it('loads extensions if needed', async () => {
      loaderMock.getExtensionsById.mockImplementationOnce(() => [
        {
          sys: { id: 'my-extension' },
          extension: {
            name: 'NAME',
            src: 'SRC',
            sidebar: true,
            fieldTypes: [{ type: 'Array', items: { type: 'Link', linkType: 'Asset' } }],
            parameters: {
              instance: [{ id: 'x' }],
              installation: [{ id: 'test' }]
            }
          },
          parameters: { test: true }
        }
      ]);

      await WidgetStore.getForEditor(loaderMock, {
        controls: [
          { widgetId: 'singleLine', widgetNamespace: NAMESPACE_BUILTIN },
          { widgetId: 'singleLine' },
          { widgetId: 'maybe-extension' },
          { widgetId: 'extension-for-sure', widgetNamespace: NAMESPACE_EXTENSION }
        ],
        sidebar: [
          { widgetId: 'publish-widget', widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN },
          { widgetId: 'sidebar-extension', widgetNamespace: NAMESPACE_EXTENSION }
        ]
      });

      expect(loaderMock.getExtensionsById).toHaveBeenCalledWith([
        'singleLine',
        'maybe-extension',
        'extension-for-sure',
        'sidebar-extension'
      ]);
    });
  });
});
