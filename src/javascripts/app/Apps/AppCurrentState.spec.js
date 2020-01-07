import getCurrentAppState from './AppCurrentState';

import {
  NAMESPACE_EXTENSION,
  NAMESPACE_BUILTIN,
  NAMESPACE_SIDEBAR_BUILTIN
} from 'widgets/WidgetNamespaces';

const EXTENSION_ID = 'test';

describe('getCurrentAppState', () => {
  describe('EditorInterface', () => {
    let cma;
    beforeEach(() => {
      cma = {
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] }))
      };
    });

    it('returns an empty object if there are no references', async () => {
      const state = await getCurrentAppState(cma, EXTENSION_ID);

      expect(state).toEqual({ EditorInterface: {} });
    });

    it('returns state object for controls, sidebar and editor', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              controls: [
                { fieldId: 'test' },
                { fieldId: 'title', widgetNamespace: NAMESPACE_EXTENSION, widgetId: EXTENSION_ID },
                { fieldId: 'content', widgetNamespace: NAMESPACE_BUILTIN, widgetId: EXTENSION_ID },
                { fieldId: 'image', widgetNamespace: NAMESPACE_EXTENSION, widgetId: EXTENSION_ID }
              ],
              sidebar: [
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: EXTENSION_ID },
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'publication-widget' }
              ],
              editor: {
                widgetNamespace: NAMESPACE_EXTENSION,
                widgetId: EXTENSION_ID
              }
            },
            {
              sys: { contentType: { sys: { id: 'CT2' } } },
              sidebar: [
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: EXTENSION_ID },
                { widgetNamespace: NAMESPACE_EXTENSION, widgetId: EXTENSION_ID },
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'publication-widget' }
              ],
              editor: {
                widgetNamespace: NAMESPACE_EXTENSION,
                widgetId: 'some-diff-extension'
              }
            }
          ]
        })
      );

      const state = await getCurrentAppState(cma, {
        sys: {
          type: 'AppInstallation',
          widgetId: EXTENSION_ID
        }
      });

      expect(state).toEqual({
        EditorInterface: {
          CT1: {
            controls: [{ fieldId: 'title' }, { fieldId: 'image' }],
            editor: true
          },
          CT2: {
            sidebar: { position: 1 }
          }
        }
      });
    });

    it('exposes settings for all controls, sidebar and editor', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() => {
        return Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              controls: [
                { fieldId: 'title', settings: { test: 'boom' } },
                {
                  fieldId: 'test',
                  widgetNamespace: NAMESPACE_EXTENSION,
                  widgetId: EXTENSION_ID,
                  settings: { hello: 'control' }
                }
              ],
              sidebar: [
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'publication-widget' },
                {
                  widgetNamespace: NAMESPACE_EXTENSION,
                  widgetId: EXTENSION_ID,
                  settings: { hello: 'sidebar' }
                }
              ],
              editor: {
                widgetNamespace: NAMESPACE_EXTENSION,
                widgetId: EXTENSION_ID,
                settings: { hello: 'editor' }
              }
            }
          ]
        });
      });

      const state = await getCurrentAppState(cma, {
        sys: {
          type: 'AppInstallation',
          widgetId: EXTENSION_ID
        }
      });

      expect(state).toEqual({
        EditorInterface: {
          CT1: {
            controls: [{ fieldId: 'test', settings: { hello: 'control' } }],
            sidebar: {
              position: 1,
              settings: { hello: 'sidebar' }
            },
            editor: {
              settings: {
                hello: 'editor'
              }
            }
          }
        }
      });
    });
  });
});
