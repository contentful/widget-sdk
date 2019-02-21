import * as WidgetStore from './WidgetStore.es6';
import { create as createBuiltinWidgetList } from './BuiltinWidgets.es6';
import {
  NAMESPACE_BUILTIN,
  NAMESPACE_EXTENSION,
  NAMESPACE_SIDEBAR_BUILTIN
} from './WidgetNamespaces.es6';

jest.mock('./ExtensionLoader.es6', () => {
  return {
    getAllExtensions: jest.fn(),
    getExtensionsById: jest.fn()
  };
});

describe('WidgetStore', () => {
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
      const { getAllExtensions } = jest.requireMock('./ExtensionLoader.es6');
      getAllExtensions.mockImplementationOnce(() => []);

      const widgets = await WidgetStore.getForContentTypeManagement('sid', 'eid');

      expect(getAllExtensions).toHaveBeenCalledWith('sid', 'eid');
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

      const { getAllExtensions } = jest.requireMock('./ExtensionLoader.es6');
      getAllExtensions.mockImplementationOnce(() => [entity]);

      const widgets = await WidgetStore.getForContentTypeManagement('sid', 'eid');
      const [extension] = widgets[NAMESPACE_EXTENSION];

      expect(getAllExtensions).toHaveBeenCalledWith('sid', 'eid');
      expect(extension.name).toEqual('NAME');
      expect(extension.src).toEqual('SRC');
      expect(extension.sidebar).toEqual(true);
      expect(extension.fieldTypes).toEqual(['Assets']);
      expect(extension.parameters).toEqual([{ id: 'x' }]);
      expect(extension.installationParameters).toEqual({
        definitions: [{ id: 'test' }],
        values: { test: true }
      });
    });
  });

  describe('#getForEditor()', () => {
    it('handles lack of editor interface', async () => {
      const { getExtensionsById } = jest.requireMock('./ExtensionLoader.es6');
      getExtensionsById.mockImplementationOnce(() => []);

      const widgets = await WidgetStore.getForEditor('sid', 'eid');

      expect(getExtensionsById).toHaveBeenCalledWith('sid', 'eid', []);
      expect(widgets[NAMESPACE_EXTENSION]).toEqual([]);
    });

    it('does not load extensions when only builtins are used', async () => {
      const { getExtensionsById } = jest.requireMock('./ExtensionLoader.es6');
      getExtensionsById.mockImplementationOnce(() => []);

      const widgets = await WidgetStore.getForEditor('sid', 'eid', {
        controls: [{ widgetId: 'singleLine', widgetNamespace: NAMESPACE_BUILTIN }],
        sidebar: [{ widgetId: 'publish-widget', widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN }]
      });

      expect(getExtensionsById).toHaveBeenCalledWith('sid', 'eid', []);
      expect(widgets[NAMESPACE_EXTENSION]).toEqual([]);
    });

    it('loads extensions if needed', async () => {
      const { getExtensionsById } = jest.requireMock('./ExtensionLoader.es6');
      getExtensionsById.mockImplementationOnce(() => []);

      await WidgetStore.getForEditor('sid', 'eid', {
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

      expect(getExtensionsById).toHaveBeenCalledWith('sid', 'eid', [
        'singleLine',
        'maybe-extension',
        'extension-for-sure',
        'sidebar-extension'
      ]);
    });
  });
});
