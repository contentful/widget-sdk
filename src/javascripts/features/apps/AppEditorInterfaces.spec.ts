import {
  removeAllEditorInterfaceReferences,
  transformEditorInterfacesToTargetState,
} from './AppEditorInterfaces';
import { WidgetNamespace } from '@contentful/widget-renderer';
import {
  makeGetDefaultByType,
  PositionalWidget,
  positionalWidgetFixtures,
} from './__mocks__/positional-widget';
import { AppInstallationProps } from 'contentful-management/types';

const APP_ID = 'appid';

jest.mock('features/contentful-apps', () => ({
  fetchContentfulAppsConfig: jest.fn().mockResolvedValue({
    isPurchased: true,
    isEnabled: true,
    isInstalled: true,
  }),
}));

const installation = {
  sys: {
    type: 'AppInstallation',
    appDefinition: {
      sys: { type: 'Link', linkType: 'AppDefinition', id: APP_ID },
    },
  },
} as AppInstallationProps;

describe('AppEditorInterfaces', () => {
  let cma, transform, remove;

  beforeEach(() => {
    const spaceData = {
      spaceId: 'test',
      organizationId: 'test',
      environmentId: 'master',
    };

    cma = {
      getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] })),
      updateEditorInterface: jest.fn(() => Promise.resolve()),
    };

    transform = (targetState) => {
      return transformEditorInterfacesToTargetState(
        cma,
        targetState,
        installation.sys.appDefinition.sys.id,
        spaceData
      );
    };

    remove = () => {
      return removeAllEditorInterfaceReferences(cma, installation.sys.appDefinition.sys.id);
    };
  });

  describe('transformEditorInterfacesToTargetState', () => {
    it('inserts widget references to editor interfaces', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              controls: [
                { fieldId: 'test', widgetNamespace: WidgetNamespace.BUILTIN, widgetId: 'markdown' },
                {
                  fieldId: 'test2',
                  widgetNamespace: WidgetNamespace.BUILTIN,
                  widgetId: 'date',
                  settings: { ampm: true },
                },
                {
                  fieldId: 'test3',
                  widgetNamespace: WidgetNamespace.APP,
                  widgetId: 'some-different-app',
                },
                {
                  fieldId: 'test4',
                  widgetNamespace: WidgetNamespace.BUILTIN,
                  widgetId: 'some-default-will-stay',
                },
                {
                  fieldId: 'test5',
                  widgetNamespace: WidgetNamespace.APP,
                  widgetId: APP_ID,
                  settings: {
                    theme: 'true',
                  },
                },
              ],
              sidebar: [
                {
                  widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
                  widgetId: 'publication-widget',
                },
                { widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'some-extension' },
              ],
              editors: [
                {
                  widgetNamespace: WidgetNamespace.EDITOR_BUILTIN,
                  widgetId: 'default-editor',
                },
              ],
            },
            {
              sys: { contentType: { sys: { id: 'CT2' } } },
              editors: [
                {
                  widgetNamespace: WidgetNamespace.EXTENSION,
                  widgetId: 'some-different-extension',
                  settings: { hello: 'world' },
                },
              ],
              sidebar: [
                { widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: 'versions-widget' },
              ],
            },
          ],
        })
      );

      await transform({
        CT1: {
          controls: [
            { fieldId: 'test' },
            { fieldId: 'test2' },
            { fieldId: 'yolo' },
            {
              fieldId: 'test5',
              settings: { theme: 'false' },
            },
          ],
          sidebar: { position: 1, settings: { theme: 'true' } },
          editors: { position: 0 },
        },
        CT2: {
          editor: true,
          sidebar: true,
        },
      });

      expect(cma.updateEditorInterface).toBeCalledTimes(2);

      expect(cma.updateEditorInterface).toHaveBeenNthCalledWith(1, {
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [
          {
            fieldId: 'test',
            widgetNamespace: WidgetNamespace.APP,
            widgetId: APP_ID,
          },
          { fieldId: 'test2', widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
          {
            fieldId: 'test3',
            widgetNamespace: WidgetNamespace.APP,
            widgetId: 'some-different-app',
          },
          {
            fieldId: 'test4',
            widgetNamespace: WidgetNamespace.BUILTIN,
            widgetId: 'some-default-will-stay',
          },
          {
            fieldId: 'test5',
            widgetNamespace: WidgetNamespace.APP,
            widgetId: APP_ID,
            settings: {
              theme: 'false',
            },
          },
          { fieldId: 'yolo', widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
        ],
        sidebar: [
          { widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: 'publication-widget' },
          {
            widgetNamespace: WidgetNamespace.APP,
            widgetId: APP_ID,
            settings: {
              theme: 'true',
            },
          },
          { widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'some-extension' },
        ],
        editors: [
          { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
          { widgetNamespace: WidgetNamespace.EDITOR_BUILTIN, widgetId: 'default-editor' },
        ],
      });

      expect(cma.updateEditorInterface).toHaveBeenNthCalledWith(2, {
        sys: { contentType: { sys: { id: 'CT2' } } },
        sidebar: [
          { widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: 'versions-widget' },
          { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
        ],
        editor: { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
      });
    });

    it('ignores failures when getting/setting editor interfaces (best effort)', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              controls: [{ fieldId: 'test' }],
            },
          ],
        })
      );

      cma.updateEditorInterface.mockImplementationOnce(() => Promise.reject('unprocessable'));

      await transform({
        CT1: {
          controls: [{ fieldId: 'test' }],
        },
      });

      expect(cma.updateEditorInterface).toBeCalledTimes(1);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [{ fieldId: 'test', widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID }],
      });
    });

    describe('positional editor interfaces', () => {
      for (const ei of Object.values(PositionalWidget)) {
        it(`updates widget position in ${ei}`, async () => {
          const mockValues = positionalWidgetFixtures[ei];
          const position = 1;

          cma.getEditorInterfaces.mockImplementationOnce(() =>
            Promise.resolve({
              items: [
                {
                  sys: { contentType: { sys: { id: 'CT1' } } },
                  controls: [
                    {
                      fieldId: 'test',
                      widgetNamespace: WidgetNamespace.APP,
                      widgetId: APP_ID,
                    },
                  ],
                  [ei]: [...mockValues, { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID }],
                },
              ],
            })
          );

          await transform({
            CT1: {
              controls: [{ fieldId: 'test' }],
              [ei]: { position },
            },
          });

          expect(cma.updateEditorInterface).toBeCalledTimes(1);

          expect(cma.updateEditorInterface).toBeCalledWith({
            sys: { contentType: { sys: { id: 'CT1' } } },
            controls: [
              {
                fieldId: 'test',
                widgetNamespace: WidgetNamespace.APP,
                widgetId: APP_ID,
              },
            ],
            [ei]: [
              ...mockValues.slice(0, position),
              { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
              ...mockValues.slice(position),
            ],
          });
        });

        it(`inserts the widget to the default ${ei} (if none is set)`, async () => {
          const getDefault = makeGetDefaultByType[ei];
          const defaultValue = await getDefault({
            spaceId: 'test',
            organizationId: 'test',
            environmentId: 'master',
          });

          cma.getEditorInterfaces.mockImplementationOnce(() =>
            Promise.resolve({
              items: [
                { sys: { contentType: { sys: { id: 'CT1' } } } },
                { sys: { contentType: { sys: { id: 'CT2' } } } },
              ],
            })
          );

          await transform({
            CT1: { [ei]: { position: 3 } },
            CT2: { [ei]: { position: 2 } },
          });

          expect(cma.updateEditorInterface).toBeCalledTimes(2);

          expect(cma.updateEditorInterface).toHaveBeenNthCalledWith(1, {
            sys: { contentType: { sys: { id: 'CT1' } } },
            [ei]: [
              ...defaultValue.slice(0, 3),
              { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
              ...defaultValue.slice(3),
            ],
          });

          expect(cma.updateEditorInterface).toHaveBeenNthCalledWith(2, {
            sys: { contentType: { sys: { id: 'CT2' } } },
            [ei]: [
              ...defaultValue.slice(0, 2),
              { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
              ...defaultValue.slice(2),
            ],
          });
        });
      }
    });

    describe('when updating editor interfaces', () => {
      it('does not call if `editors` was not modified', async () => {
        cma.getEditorInterfaces.mockImplementationOnce(() => {
          return Promise.resolve({
            items: [
              {
                sys: { contentType: { sys: { id: 'CT1' } } },
                editors: [{ widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID }],
              },
            ],
          });
        });

        await transform({ CT1: { editors: { position: 0 } } });

        expect(cma.updateEditorInterface).not.toBeCalled();
      });

      it('does not call if `editor` was not modified', async () => {
        cma.getEditorInterfaces.mockImplementationOnce(() => {
          return Promise.resolve({
            items: [
              {
                sys: { contentType: { sys: { id: 'CT1' } } },
                editor: { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
              },
            ],
          });
        });

        await transform({ CT1: { editor: true } });

        expect(cma.updateEditorInterface).not.toBeCalled();
      });

      it('does not call if `sidebar` was not modified', async () => {
        cma.getEditorInterfaces.mockImplementationOnce(() => {
          return Promise.resolve({
            items: [
              {
                sys: { contentType: { sys: { id: 'CT1' } } },
                sidebar: [{ widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID }],
              },
            ],
          });
        });

        await transform({ CT1: { sidebar: { position: 0 } } });

        expect(cma.updateEditorInterface).not.toBeCalled();
      });

      it('does not call if `controls` was not modified', async () => {
        cma.getEditorInterfaces.mockImplementationOnce(() => {
          return Promise.resolve({
            items: [
              {
                sys: { contentType: { sys: { id: 'CT1' } } },
                controls: [
                  { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID, fieldId: 'fieldId' },
                ],
              },
            ],
          });
        });

        await transform({ CT1: { controls: [{ fieldId: 'fieldId' }] } });

        expect(cma.updateEditorInterface).not.toBeCalled();
      });
    });
  });

  describe('removeAllEditorInterfaceReferences', () => {
    it('removes references from controls, sidebar, editors and editor', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              editors: [{ widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID }],
              sidebar: [
                { widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: APP_ID },
                {
                  widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
                  widgetId: 'publication-widget',
                },
                { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
                { widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'different-extension' },
                { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
              ],
            },
            {
              sys: { contentType: { sys: { id: 'CT2' } } },
              controls: [
                { fieldId: 'title' },
                { fieldId: 'author', widgetNamespace: WidgetNamespace.BUILTIN, widgetId: APP_ID },
                { fieldId: 'date', widgetNamespace: WidgetNamespace.APP, widgetId: 'different' },
                { fieldId: 'lead', widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
                { fieldId: 'content', widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
              ],
              editor: { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
            },
          ],
        })
      );

      await remove();

      expect(cma.updateEditorInterface).toBeCalledTimes(2);

      expect(cma.updateEditorInterface).toHaveBeenNthCalledWith(1, {
        sys: { contentType: { sys: { id: 'CT1' } } },
        sidebar: [
          { widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: APP_ID },
          { widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: 'publication-widget' },
          { widgetNamespace: WidgetNamespace.EXTENSION, widgetId: 'different-extension' },
        ],
      });

      expect(cma.updateEditorInterface).toHaveBeenNthCalledWith(2, {
        sys: { contentType: { sys: { id: 'CT2' } } },
        controls: [
          { fieldId: 'title' },
          { fieldId: 'author', widgetNamespace: WidgetNamespace.BUILTIN, widgetId: APP_ID },
          { fieldId: 'date', widgetNamespace: WidgetNamespace.APP, widgetId: 'different' },
          { fieldId: 'lead' },
          { fieldId: 'content' },
        ],
      });
    });

    it('removes references from controls, sidebar and editor only for current app', async () => {
      const ANOTHER_APP_ID = 'another-app-id';

      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              editors: [
                { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
                { widgetNamespace: WidgetNamespace.APP, widgetId: ANOTHER_APP_ID },
              ],
              sidebar: [
                { widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: APP_ID },
                { widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: ANOTHER_APP_ID },
                { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
                { widgetNamespace: WidgetNamespace.APP, widgetId: ANOTHER_APP_ID },
              ],
            },
            {
              sys: { contentType: { sys: { id: 'CT2' } } },
              controls: [
                { fieldId: 'title' },
                { fieldId: 'author', widgetNamespace: WidgetNamespace.BUILTIN, widgetId: APP_ID },
                { fieldId: 'date', widgetNamespace: WidgetNamespace.APP, widgetId: ANOTHER_APP_ID },
              ],
              editors: [
                { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
                { widgetNamespace: WidgetNamespace.APP, widgetId: ANOTHER_APP_ID },
              ],
            },
          ],
        })
      );

      await remove();

      expect(cma.updateEditorInterface).toBeCalledTimes(2);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        sidebar: [
          { widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: APP_ID },
          { widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: ANOTHER_APP_ID },
          { widgetNamespace: WidgetNamespace.APP, widgetId: ANOTHER_APP_ID },
        ],
        editors: [{ widgetNamespace: WidgetNamespace.APP, widgetId: ANOTHER_APP_ID }],
      });

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT2' } } },
        controls: [
          { fieldId: 'title' },
          { fieldId: 'author', widgetNamespace: WidgetNamespace.BUILTIN, widgetId: APP_ID },
          { fieldId: 'date', widgetNamespace: WidgetNamespace.APP, widgetId: ANOTHER_APP_ID },
        ],
        editors: [{ widgetNamespace: WidgetNamespace.APP, widgetId: ANOTHER_APP_ID }],
      });
    });

    it('removes all references from editors and does not send empty editors list', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              editors: [{ widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID }],
              sidebar: [{ widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: APP_ID }],
            },
          ],
        })
      );

      await remove();

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        sidebar: [{ widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: APP_ID }],
      });
    });

    it('removes only current editor and does not touch others', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              editor: { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
              sidebar: [{ widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: APP_ID }],
            },
            {
              sys: { contentType: { sys: { id: 'CT2' } } },
              editor: { widgetNamespace: WidgetNamespace.APP, widgetId: 'another-widget' },
              sidebar: [{ widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID }],
            },
          ],
        })
      );

      await remove();

      expect(cma.updateEditorInterface).toHaveBeenNthCalledWith(1, {
        sys: { contentType: { sys: { id: 'CT1' } } },
        sidebar: [{ widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: APP_ID }],
      });

      expect(cma.updateEditorInterface).toHaveBeenNthCalledWith(2, {
        sys: { contentType: { sys: { id: 'CT2' } } },
        sidebar: [],
        editor: { widgetNamespace: WidgetNamespace.APP, widgetId: 'another-widget' },
      });
    });

    it('ignores failures when getting/updating editor interfaces (best effort)', async () => {
      cma.getEditorInterfaces.mockImplementationOnce(() =>
        Promise.resolve({
          items: [
            {
              sys: { contentType: { sys: { id: 'CT1' } } },
              controls: [
                { fieldId: 'test', widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
              ],
            },
          ],
        })
      );

      cma.updateEditorInterface.mockImplementationOnce(() => Promise.reject('unprocessable'));

      await remove();

      expect(cma.updateEditorInterface).toBeCalledTimes(1);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [{ fieldId: 'test' }],
      });
    });

    it('does not issue an HTTP request if editor interface was not modified', async () => {
      await remove();

      expect(cma.updateEditorInterface).not.toBeCalled();
    });
  });
});
