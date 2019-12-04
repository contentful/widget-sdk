import { cloneDeep } from 'lodash';

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

jest.mock('./CustomWidgetLoaderInstance', () => ({
  getCustomWidgetLoader: jest.fn()
}));

describe('WidgetStore', () => {
  let loaderMock;
  beforeEach(() => {
    loaderMock = {
      getByIds: jest.fn(),
      getUncachedForListing: jest.fn()
    };
    const mock = jest.requireMock('./CustomWidgetLoaderInstance');
    mock.getCustomWidgetLoader.mockReturnValue(loaderMock);
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
      loaderMock.getUncachedForListing.mockResolvedValueOnce([]);

      const widgets = await WidgetStore.getForContentTypeManagement();

      expect(loaderMock.getUncachedForListing).toHaveBeenCalledTimes(1);
      expect(widgets[NAMESPACE_EXTENSION]).toEqual([]);
      expect(widgets[NAMESPACE_BUILTIN].map(w => w.id)).toEqual(
        createBuiltinWidgetList().map(b => b.id)
      );
    });

    it('includes extensions and apps', async () => {
      const widgets = [
        { src: 'http://localhost:1234', name: 'test', fieldTypes: ['Asset'] },
        { src: 'https://myapp.com', name: 'Test App', isApp: true, fieldTypes: ['Text'] }
      ];

      loaderMock.getUncachedForListing = jest.fn().mockResolvedValueOnce(widgets);

      const result = await WidgetStore.getForContentTypeManagement();
      const namespaceWidgets = result[NAMESPACE_EXTENSION];

      expect(namespaceWidgets).toEqual(cloneDeep(widgets));
    });
  });

  describe('#getForEditor()', () => {
    it('handles lack of editor interface', async () => {
      loaderMock.getByIds.mockImplementationOnce(() => []);

      const widgets = await WidgetStore.getForEditor();

      expect(loaderMock.getByIds).toHaveBeenCalledWith([]);
      expect(widgets[NAMESPACE_EXTENSION]).toEqual([]);
    });

    it('does not load extensions when only builtins are used', async () => {
      loaderMock.getByIds.mockImplementationOnce(() => []);

      const widgets = await WidgetStore.getForEditor({
        controls: [{ widgetId: 'singleLine', widgetNamespace: NAMESPACE_BUILTIN }],
        sidebar: [{ widgetId: 'publish-widget', widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN }]
      });

      expect(loaderMock.getByIds).toHaveBeenCalledWith([]);
      expect(widgets[NAMESPACE_EXTENSION]).toEqual([]);
    });

    it('loads extensions if needed', async () => {
      loaderMock.getByIds.mockImplementationOnce(() => [
        { id: 'sidebar-extension' },
        { id: 'extension-for-sure' }
      ]);

      const widgets = await WidgetStore.getForEditor({
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

      expect(loaderMock.getByIds).toHaveBeenCalledWith([
        'singleLine',
        'maybe-extension',
        'extension-for-sure',
        'sidebar-extension'
      ]);
      expect(widgets[NAMESPACE_EXTENSION].map(w => w.id)).toEqual([
        'sidebar-extension',
        'extension-for-sure'
      ]);
    });
  });
});
