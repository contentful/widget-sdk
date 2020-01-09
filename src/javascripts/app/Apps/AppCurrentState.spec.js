import getCurrentAppState from './AppCurrentState';

import {
  NAMESPACE_EXTENSION,
  NAMESPACE_BUILTIN,
  NAMESPACE_SIDEBAR_BUILTIN,
  NAMESPACE_APP
} from 'widgets/WidgetNamespaces';

const APP_ID = 'some-app';

const installation = {
  sys: {
    type: 'AppInstallation',
    appDefinition: {
      sys: {
        type: 'Link',
        linkType: 'AppDefinition',
        id: APP_ID
      }
    }
  }
};

describe('getCurrentAppState', () => {
  describe('EditorInterface', () => {
    let cma;
    beforeEach(() => {
      cma = {
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] }))
      };
    });

    it('returns an empty object if there are no references', async () => {
      const state = await getCurrentAppState(cma, installation);

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
                { fieldId: 'title', widgetNamespace: NAMESPACE_EXTENSION, widgetId: APP_ID },
                { fieldId: 'content', widgetNamespace: NAMESPACE_BUILTIN, widgetId: APP_ID },
                { fieldId: 'image', widgetNamespace: NAMESPACE_APP, widgetId: APP_ID }
              ],
              sidebar: [
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: APP_ID },
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'publication-widget' }
              ],
              editor: {
                widgetNamespace: NAMESPACE_APP,
                widgetId: APP_ID
              }
            },
            {
              sys: { contentType: { sys: { id: 'CT2' } } },
              sidebar: [
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: APP_ID },
                { widgetNamespace: NAMESPACE_APP, widgetId: APP_ID },
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'publication-widget' }
              ],
              editor: {
                widgetNamespace: NAMESPACE_APP,
                widgetId: 'some-diff-app'
              }
            }
          ]
        })
      );

      const state = await getCurrentAppState(cma, installation);

      expect(state).toEqual({
        EditorInterface: {
          CT1: {
            controls: [{ fieldId: 'image' }],
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
                  widgetNamespace: NAMESPACE_APP,
                  widgetId: APP_ID,
                  settings: { hello: 'control' }
                }
              ],
              sidebar: [
                { widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN, widgetId: 'publication-widget' },
                {
                  widgetNamespace: NAMESPACE_APP,
                  widgetId: APP_ID,
                  settings: { hello: 'sidebar' }
                }
              ],
              editor: {
                widgetNamespace: NAMESPACE_APP,
                widgetId: APP_ID,
                settings: { hello: 'editor' }
              }
            }
          ]
        });
      });

      const state = await getCurrentAppState(cma, installation);

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
