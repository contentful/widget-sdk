import * as WidgetStore from './WidgetStore.es6';
import { create as createBuiltinWidgetList } from './BuiltinWidgets.es6';
import {
  NAMESPACE_BUILTIN,
  NAMESPACE_EXTENSION,
  NAMESPACE_SIDEBAR_BUILTIN
} from './WidgetNamespaces.es6';

import * as spaceContextMocked from 'ng/spaceContext';

jest.mock('./BuiltinWidgets.es6', () => ({
  create: () => []
}));

describe('WidgetStore', () => {
  const loaderMock = spaceContextMocked.extensionLoader;

  beforeEach(() => {
    Object.keys(spaceContextMocked.extensionLoader).forEach(key => {
      if (spaceContextMocked.extensionLoader[key].mock) {
        spaceContextMocked.extensionLoader[key] = jest.fn();
      }
    });
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
      loaderMock.getAllExtensions.mockImplementationOnce(() => []);

      const widgets = await WidgetStore.getForContentTypeManagement();

      expect(loaderMock.getAllExtensions).toHaveBeenCalledWith();
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

      loaderMock.getAllExtensions.mockImplementationOnce(() => [entity]);

      const widgets = await WidgetStore.getForContentTypeManagement();
      const [extension] = widgets[NAMESPACE_EXTENSION];

      expect(loaderMock.getAllExtensions).toHaveBeenCalledWith();
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
      loaderMock.getExtensionsById.mockImplementationOnce(() => []);

      const widgets = await WidgetStore.getForEditor();

      expect(loaderMock.getExtensionsById).toHaveBeenCalledWith([]);
      expect(widgets[NAMESPACE_EXTENSION]).toEqual([]);
    });

    it('does not load extensions when only builtins are used', async () => {
      loaderMock.getExtensionsById.mockImplementationOnce(() => []);

      const widgets = await WidgetStore.getForEditor({
        controls: [{ widgetId: 'singleLine', widgetNamespace: NAMESPACE_BUILTIN }],
        sidebar: [{ widgetId: 'publish-widget', widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN }]
      });

      expect(loaderMock.getExtensionsById).toHaveBeenCalledWith([]);
      expect(widgets[NAMESPACE_EXTENSION]).toEqual([]);
    });

    it('loads extensions if needed', async () => {
      loaderMock.getExtensionsById.mockImplementationOnce(() => []);

      await WidgetStore.getForEditor({
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
