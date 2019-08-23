import { omit } from 'lodash';

import * as WidgetStore from './WidgetStore.es6';
import { create as createBuiltinWidgetList } from './BuiltinWidgets.es6';
import {
  NAMESPACE_BUILTIN,
  NAMESPACE_EXTENSION,
  NAMESPACE_SIDEBAR_BUILTIN
} from './WidgetNamespaces.es6';

jest.mock('./BuiltinWidgets.es6', () => ({
  create: () => []
}));

describe('WidgetStore', () => {
  let loaderMock;

  beforeEach(() => {
    loaderMock = {
      evictExtension: jest.fn(),
      getExtensionsById: jest.fn(),
      getAllExtensionsForListing: jest.fn()
    };
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
      loaderMock.getAllExtensionsForListing.mockImplementationOnce(() => []);

      const widgets = await WidgetStore.getForContentTypeManagement(loaderMock);

      expect(loaderMock.getAllExtensionsForListing).toHaveBeenCalledWith();
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

      loaderMock.getAllExtensionsForListing.mockImplementationOnce(() => [
        entity,
        {
          ...entity,
          sys: { id: 'srcdoc-extension', srcdocSha256: 'somecodesha' },
          extension: omit(entity.extension, ['src'])
        },
        {
          ...entity,
          sys: { id: 'definition-extension' },
          extension: { ...entity.extension },
          extensionDefinition: {
            sys: {
              type: 'Link',
              linkType: 'ExtensionDefinition',
              id: 'definition-id'
            }
          }
        }
      ]);

      const widgets = await WidgetStore.getForContentTypeManagement(loaderMock);
      const [extension, srcdocExtension, definitionExtension] = widgets[NAMESPACE_EXTENSION];

      expect(loaderMock.getAllExtensionsForListing).toHaveBeenCalledTimes(1);

      expect(extension.id).toEqual('my-extension');
      expect(extension.extensionDefinitionId).toBeUndefined();
      expect(extension.name).toEqual('NAME');
      expect(extension.src).toEqual('SRC');
      expect(extension.sidebar).toEqual(true);
      expect(extension.fieldTypes).toEqual(['Assets']);
      expect(extension.parameters).toEqual([{ id: 'x' }]);
      expect(extension.installationParameters).toEqual({
        definitions: [{ id: 'test' }],
        values: { test: true }
      });

      expect(srcdocExtension.id).toEqual('srcdoc-extension');
      expect(srcdocExtension.extensionDefinitionId).toBeUndefined();
      expect(srcdocExtension.src).toBeUndefined();
      expect(srcdocExtension.srcdoc).toEqual(true);

      expect(definitionExtension.id).toEqual('definition-extension');
      expect(definitionExtension.extensionDefinitionId).toEqual('definition-id');
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
      loaderMock.getExtensionsById.mockImplementationOnce(() => []);

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
