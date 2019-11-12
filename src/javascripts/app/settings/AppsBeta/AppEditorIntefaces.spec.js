import {
  getDefaultSidebar,
  transformEditorInterfacesToTargetState,
  removeAllEditorInterfaceReferences
} from './AppEditorInterfaces';

import {
  NAMESPACE_EXTENSION,
  NAMESPACE_BUILTIN,
  NAMESPACE_SIDEBAR_BUILTIN
} from 'widgets/WidgetNamespaces';

const EXTENSION_ID = 'extid';

jest.mock('i13n/Telemetry', () => ({ count: () => {} }));
jest.mock('data/CMA/ProductCatalog', () => ({ getCurrentSpaceFeature: () => true }));

describe('AppEditorInterfaces', () => {
  let cma, transform, remove;

  beforeEach(() => {
    cma = {
      getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] })),
      updateEditorInterface: jest.fn(() => Promise.resolve())
    };

    transform = targetState => {
      return transformEditorInterfacesToTargetState(cma, targetState, EXTENSION_ID);
    };

    remove = () => {
      return removeAllEditorInterfaceReferences(cma, EXTENSION_ID);
    };
  });

  describe('transformEditorInterfacesToTargetState', () => {
    it('inserts extension references to editor interfaces', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              controls: [
                { fieldId: 'test', widgetNamespace: NAMESPACE_BUILTIN, widgetId: 'markdown' },
                {
                  fieldId: 'test2',
                  widgetNamespace: NAMESPACE_BUILTIN,
                  widgetId: 'date',
                  settings: { ampm: true }
                }
              ],
              sidebar: [
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'publication-widget' },
                { widgetNamespace: NAMESPACE_EXTENSION, widgetId: 'some-extension' }
              ]
            },
            {
              sys: { contentType: { sys: { id: 'CT2' } } },
              editor: {
                widgetNamespace: NAMESPACE_EXTENSION,
                widgetId: 'some-different-extension',
                settings: { hello: 'world' }
              },
              sidebar: [{ widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'versions-widget' }]
            }
          ]
        })
      );

      await transform({
        CT1: {
          controls: [{ fieldId: 'test', settings: { test: true } }, { fieldId: 'test2' }],
          sidebar: {
            position: 1,
            settings: { hello: 'world' }
          }
        },
        CT2: {
          editor: true,
          sidebar: true
        }
      });

      expect(cma.updateEditorInterface).toBeCalledTimes(2);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [
          {
            fieldId: 'test',
            widgetNamespace: NAMESPACE_EXTENSION,
            widgetId: EXTENSION_ID,
            settings: { test: true }
          },
          { fieldId: 'test2', widgetNamespace: NAMESPACE_EXTENSION, widgetId: EXTENSION_ID }
        ],
        sidebar: [
          { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'publication-widget' },
          {
            widgetNamespace: NAMESPACE_EXTENSION,
            widgetId: EXTENSION_ID,
            settings: { hello: 'world' }
          },
          { widgetNamespace: NAMESPACE_EXTENSION, widgetId: 'some-extension' }
        ]
      });

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT2' } } },
        editor: {
          widgetNamespace: NAMESPACE_EXTENSION,
          widgetId: EXTENSION_ID
        },
        sidebar: [
          { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'versions-widget' },
          { widgetNamespace: NAMESPACE_EXTENSION, widgetId: EXTENSION_ID }
        ]
      });
    });

    it('ignores failures when getting/setting editor interfaces (best effort)', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              controls: [{ fieldId: 'test' }]
            }
          ]
        })
      );

      cma.updateEditorInterface.mockImplementationOnce(() => Promise.reject('unprocessable'));

      await transform({
        CT1: {
          controls: [{ fieldId: 'test' }]
        }
      });

      expect(cma.updateEditorInterface).toBeCalledTimes(1);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [
          { fieldId: 'test', widgetNamespace: NAMESPACE_EXTENSION, widgetId: EXTENSION_ID }
        ]
      });
    });

    it('updates widget settings and position in the sidebar', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              controls: [
                {
                  fieldId: 'test',
                  widgetNamespace: NAMESPACE_EXTENSION,
                  widgetId: EXTENSION_ID,
                  settings: { test: true }
                }
              ],
              sidebar: [
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'publication-widget' },
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'versions-widget' },
                {
                  widgetNamespace: NAMESPACE_EXTENSION,
                  widgetId: EXTENSION_ID,
                  settings: { hello: 'world' }
                }
              ]
            }
          ]
        })
      );

      await transform({
        CT1: {
          controls: [{ fieldId: 'test', settings: { test: false, extra: true } }],
          sidebar: {
            position: 1,
            settings: { hello: 'jakub' }
          }
        }
      });

      expect(cma.updateEditorInterface).toBeCalledTimes(1);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [
          {
            fieldId: 'test',
            widgetNamespace: NAMESPACE_EXTENSION,
            widgetId: EXTENSION_ID,
            settings: { test: false, extra: true }
          }
        ],
        sidebar: [
          { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'publication-widget' },
          {
            widgetNamespace: NAMESPACE_EXTENSION,
            widgetId: EXTENSION_ID,
            settings: { hello: 'jakub' }
          },
          { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'versions-widget' }
        ]
      });
    });

    it('inserts the widget to the default sidebar (if none is set)', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            { sys: { contentType: { sys: { id: 'CT1' } } } },
            { sys: { contentType: { sys: { id: 'CT2' } } } }
          ]
        })
      );

      await transform({
        CT1: { sidebar: { position: 3 } },
        CT2: { sidebar: { position: 2 } }
      });

      expect(cma.updateEditorInterface).toBeCalledTimes(2);

      const defaultSidebar = await getDefaultSidebar();

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        sidebar: [
          ...defaultSidebar.slice(0, 3),
          { widgetNamespace: NAMESPACE_EXTENSION, widgetId: EXTENSION_ID },
          ...defaultSidebar.slice(3)
        ]
      });

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT2' } } },
        sidebar: [
          ...defaultSidebar.slice(0, 2),
          { widgetNamespace: NAMESPACE_EXTENSION, widgetId: EXTENSION_ID },
          ...defaultSidebar.slice(2)
        ]
      });
    });

    it('only does HTTP if editor interface was modified', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() => {
        return Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              editor: {
                widgetNamespace: NAMESPACE_EXTENSION,
                widgetId: EXTENSION_ID
              }
            }
          ]
        });
      });

      await transform({ CT1: { editor: true } });

      expect(cma.updateEditorInterface).not.toBeCalled();
    });
  });

  describe('removeAllEditorInterfaceReferences', () => {
    it('removes references from controls, sidebar and editor', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              editor: {
                widgetNamespace: NAMESPACE_EXTENSION,
                widgetId: EXTENSION_ID
              },
              sidebar: [
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: EXTENSION_ID },
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'publication-widget' },
                { widgetNamespace: NAMESPACE_EXTENSION, widgetId: EXTENSION_ID },
                { widgetNamespace: NAMESPACE_EXTENSION, widgetId: 'different-extension' },
                {
                  widgetNamespace: NAMESPACE_EXTENSION,
                  widgetId: EXTENSION_ID,
                  settings: { test: true }
                }
              ]
            },
            {
              sys: { contentType: { sys: { id: 'CT2' } } },
              controls: [
                { fieldId: 'title' },
                { fieldId: 'author', widgetNamespace: NAMESPACE_BUILTIN, widgetId: EXTENSION_ID },
                { fieldId: 'date', widgetNamespace: NAMESPACE_EXTENSION, widgetId: 'different' },
                { fieldId: 'lead', widgetNamespace: NAMESPACE_EXTENSION, widgetId: EXTENSION_ID },
                {
                  fieldId: 'content',
                  widgetNamespace: NAMESPACE_EXTENSION,
                  widgetId: EXTENSION_ID,
                  settings: { test: true }
                }
              ],
              editor: {
                widgetNamespace: NAMESPACE_EXTENSION,
                widgetId: 'some-other-editor'
              }
            }
          ]
        })
      );

      await remove();

      expect(cma.updateEditorInterface).toBeCalledTimes(2);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        sidebar: [
          { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: EXTENSION_ID },
          { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'publication-widget' },
          { widgetNamespace: NAMESPACE_EXTENSION, widgetId: 'different-extension' }
        ]
      });

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT2' } } },
        controls: [
          { fieldId: 'title' },
          { fieldId: 'author', widgetNamespace: NAMESPACE_BUILTIN, widgetId: EXTENSION_ID },
          { fieldId: 'date', widgetNamespace: NAMESPACE_EXTENSION, widgetId: 'different' },
          { fieldId: 'lead' },
          { fieldId: 'content' }
        ],
        editor: {
          widgetNamespace: NAMESPACE_EXTENSION,
          widgetId: 'some-other-editor'
        }
      });
    });

    it('ignores failures when getting/updating editor interfaces (best effort)', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              controls: [
                { fieldId: 'test', widgetNamespace: NAMESPACE_EXTENSION, widgetId: EXTENSION_ID }
              ]
            }
          ]
        })
      );

      cma.updateEditorInterface.mockImplementationOnce(() => Promise.reject('unprocessable'));

      await remove();

      expect(cma.updateEditorInterface).toBeCalledTimes(1);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [{ fieldId: 'test' }]
      });
    });

    it('does not issue an HTTP request if editor interface was not modified', async () => {
      await remove();

      expect(cma.updateEditorInterface).not.toBeCalled();
    });
  });
});
