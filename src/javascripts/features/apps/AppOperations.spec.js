import * as AppOperations from './AppOperations';
import { WidgetNamespace } from '@contentful/widget-renderer';

const APP_ID = 'some-app';

const status = {
  appDefinition: { sys: { type: 'AppDefinition', id: APP_ID } },
  appInstallation: {
    sys: {
      type: 'AppInstallation',
      appDefinition: {
        sys: { type: 'Link', linkType: 'AppDefinition', id: APP_ID },
      },
    },
  },
  isMarketplaceInstallation: false,
};

describe('AppOperations', () => {
  describe('installOrUpdate', () => {
    it('validates target state', async () => {
      expect.assertions(1);

      try {
        await AppOperations.installOrUpdate(
          {},
          () => {},
          () => {},
          {
            targetState: {
              EditorInterface: {
                CT1: {
                  sidebar: { position: 'BOOM' },
                },
              },
            },
          }
        );
      } catch (err) {
        expect(err.message).toMatch(/Invalid target sidebar/);
      }
    });

    it('stores parameters in AppInstallation entity', async () => {
      const cma = {
        updateAppInstallation: jest.fn((_, parameters) => {
          return Promise.resolve({
            sys: status.appInstallation.sys,
            parameters,
          });
        }),
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] })),
      };
      const evictWidget = jest.fn().mockResolvedValue();
      const checkAppStatus = jest.fn(() => Promise.resolve(status));

      await AppOperations.installOrUpdate(cma, evictWidget, checkAppStatus, {
        parameters: { test: true },
      });

      expect(cma.updateAppInstallation).toBeCalledTimes(1);
      expect(cma.updateAppInstallation).toBeCalledWith('some-app', { test: true }, false);
      expect(evictWidget).toBeCalledTimes(1);
      expect(evictWidget).toBeCalledWith({
        sys: status.appInstallation.sys,
        parameters: { test: true },
      });
    });

    it('fails if AppInstallation cannot be updated', async () => {
      const cma = {
        updateAppInstallation: jest.fn(() => Promise.reject('unprocessable')),
      };
      const evictWidget = jest.fn().mockResolvedValue();
      const checkAppStatus = jest.fn(() => Promise.resolve(status));

      expect.assertions(3);

      try {
        await AppOperations.installOrUpdate(cma, evictWidget, checkAppStatus);
      } catch (err) {
        expect(err).toMatch('unprocessable');
        expect(cma.updateAppInstallation).toBeCalledTimes(1);
        expect(evictWidget).not.toBeCalled();
      }
    });

    it('executes the target state plan', async () => {
      const cma = {
        updateAppInstallation: jest.fn(() => Promise.resolve(status.appInstallation)),
        getEditorInterfaces: jest.fn(() => {
          return Promise.resolve({
            items: [
              {
                sys: { contentType: { sys: { id: 'CT1' } } },
                controls: [
                  {
                    fieldId: 'xxx',
                    widgetNamespace: WidgetNamespace.BUILTIN,
                    widgetId: 'markdown',
                  },
                ],
              },
            ],
          });
        }),
        updateEditorInterface: jest.fn((ext) => Promise.resolve(ext)),
      };
      const evictWidget = jest.fn().mockResolvedValue();
      const checkAppStatus = jest.fn(() => Promise.resolve(status));

      await AppOperations.installOrUpdate(cma, evictWidget, checkAppStatus, {
        targetState: {
          EditorInterface: {
            CT1: {
              controls: [{ fieldId: 'xxx' }],
            },
          },
        },
      });

      expect(cma.updateAppInstallation).toBeCalledTimes(1);
      expect(cma.getEditorInterfaces).toBeCalledTimes(1);
      expect(cma.updateEditorInterface).toBeCalledTimes(1);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [{ fieldId: 'xxx', widgetNamespace: WidgetNamespace.APP, widgetId: 'some-app' }],
      });

      expect(evictWidget).toBeCalledTimes(1);
      expect(evictWidget).toBeCalledWith(status.appInstallation);
    });
  });

  describe('uninstall', () => {
    it('removes widget references from editor interfaces', async () => {
      const cma = {
        getEditorInterfaces: jest.fn(() =>
          Promise.resolve({
            items: [
              {
                sys: { contentType: { sys: { id: 'CT1' } } },
                controls: [
                  { fieldId: 'title', widgetNamespace: WidgetNamespace.BUILTIN, widgetId: APP_ID },
                  {
                    fieldId: 'content',
                    widgetNamespace: WidgetNamespace.BUILTIN,
                    widgetId: 'markdown',
                  },
                  { fieldId: 'author', widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
                ],
                sidebar: [
                  {
                    widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
                    widgetId: 'publication-widget',
                  },
                  { widgetNamespace: WidgetNamespace.APP, widgetId: APP_ID },
                ],
                editor: {
                  widgetNamespace: WidgetNamespace.APP,
                  widgetId: APP_ID,
                },
              },
            ],
          })
        ),
        updateEditorInterface: jest.fn((ei) => Promise.resolve(ei)),
        deleteAppInstallation: jest.fn(() => Promise.resolve()),
      };
      const evictWidget = jest.fn().mockResolvedValue();
      const checkAppStatus = jest.fn(() => Promise.resolve(status));

      await AppOperations.uninstall(cma, evictWidget, checkAppStatus);

      expect(cma.getEditorInterfaces).toBeCalledTimes(1);
      expect(cma.updateEditorInterface).toBeCalledTimes(1);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [
          { fieldId: 'title', widgetNamespace: WidgetNamespace.BUILTIN, widgetId: APP_ID },
          { fieldId: 'content', widgetNamespace: WidgetNamespace.BUILTIN, widgetId: 'markdown' },
          { fieldId: 'author' },
        ],
        sidebar: [
          { widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN, widgetId: 'publication-widget' },
        ],
      });

      expect(evictWidget).toBeCalledTimes(1);
      expect(evictWidget).toBeCalledWith(status.appInstallation);
    });

    it('deletes the installation', async () => {
      const cma = {
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] })),
        deleteAppInstallation: jest.fn(() => Promise.resolve()),
      };
      const evictWidget = jest.fn().mockResolvedValue();
      const checkAppStatus = jest.fn(() => Promise.resolve(status));

      await AppOperations.uninstall(cma, evictWidget, checkAppStatus);

      expect(cma.deleteAppInstallation).toBeCalledTimes(1);
      expect(cma.deleteAppInstallation).toBeCalledWith('some-app');

      expect(evictWidget).toBeCalledTimes(1);
      expect(evictWidget).toBeCalledWith(status.appInstallation);
    });

    it('fails if an installation cannot be deleted', async () => {
      const cma = {
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] })),
        deleteAppInstallation: jest.fn(() => Promise.reject('unauthorized')),
      };
      const evictWidget = jest.fn().mockResolvedValue();
      const checkAppStatus = jest.fn(() => Promise.resolve(status));

      expect.assertions(3);

      try {
        await AppOperations.uninstall(cma, evictWidget, checkAppStatus);
      } catch (err) {
        expect(cma.deleteAppInstallation).toBeCalledWith('some-app');
        expect(err).toMatch('unauthorized');
        expect(evictWidget).not.toBeCalled();
      }
    });
  });
});
