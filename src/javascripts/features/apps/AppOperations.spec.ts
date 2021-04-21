import * as AppOperations from './AppOperations';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { MarketplaceApp } from 'features/apps-core';
import APIClient from 'data/APIClient';

jest.mock('features/contentful-apps', () => ({
  fetchContentfulAppsConfig: jest.fn().mockResolvedValue({
    isPurchased: true,
    isEnabled: true,
    isInstalled: true,
    isTrialAvailable: true,
  }),
}));

const APP_ID = 'some-app';

const status = {
  appDefinition: {
    sys: {
      type: 'AppDefinition',
      id: APP_ID,
      organization: { sys: { id: 'org-id', type: 'Link', linkType: 'Organization' } },
    },
  },
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
          {} as MarketplaceApp,
          ({} as unknown) as APIClient,
          () => ({}),
          () => ({} as any),
          {
            targetState: {
              EditorInterface: {
                CT1: {
                  sidebar: { position: 'BOOM' },
                },
              },
            },
          },
          {}
        );
      } catch (err) {
        expect(err.message).toMatch(/Invalid target sidebar/);
      }
    });

    it('stores parameters in AppInstallation entity', async () => {
      const cma = ({
        updateAppInstallation: jest.fn((_, parameters) => {
          return Promise.resolve({
            sys: status.appInstallation.sys,
            parameters,
          });
        }),
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] })),
      } as unknown) as APIClient;
      const evictWidget = jest.fn().mockResolvedValue(null);
      const checkAppStatus = jest.fn(() => Promise.resolve(status));
      const spaceData = {
        spaceId: 'spaceId',
        environmentId: 'environmentId',
        organizationId: 'organizationId',
      };

      await AppOperations.installOrUpdate(
        {} as MarketplaceApp,
        cma,
        evictWidget,
        checkAppStatus,
        {
          parameters: { test: true },
        },
        spaceData
      );

      expect(cma.updateAppInstallation).toBeCalledTimes(1);
      expect(cma.updateAppInstallation).toBeCalledWith('some-app', { test: true }, false);
      expect(evictWidget).toBeCalledTimes(1);
      expect(evictWidget).toBeCalledWith({
        sys: status.appInstallation.sys,
        parameters: { test: true },
      });
    });

    it('fails if AppInstallation cannot be updated', async () => {
      const cma = ({
        updateAppInstallation: jest.fn(() => Promise.reject('unprocessable')),
      } as unknown) as APIClient;
      const evictWidget = jest.fn().mockResolvedValue(null);
      const checkAppStatus = jest.fn(() => Promise.resolve(status));
      const spaceData = {
        spaceId: 'spaceId',
        environmentId: 'environmentId',
        organizationId: 'organizationId',
      };

      expect.assertions(3);

      try {
        await AppOperations.installOrUpdate(
          {} as MarketplaceApp,
          cma,
          evictWidget,
          checkAppStatus,
          {},
          spaceData
        );
      } catch (err) {
        expect(err).toMatch('unprocessable');
        expect(cma.updateAppInstallation).toBeCalledTimes(1);
        expect(evictWidget).not.toBeCalled();
      }
    });

    it('executes the target state plan', async () => {
      const cma = ({
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
      } as unknown) as APIClient;
      const evictWidget = jest.fn().mockResolvedValue(null);
      const checkAppStatus = jest.fn(() => Promise.resolve(status));
      const spaceData = {
        spaceId: 'spaceId',
        environmentId: 'environmentId',
        organizationId: 'organizationId',
      };

      await AppOperations.installOrUpdate(
        { appDefinition: status.appDefinition } as MarketplaceApp,
        cma,
        evictWidget,
        checkAppStatus,
        {
          targetState: {
            EditorInterface: {
              CT1: {
                controls: [{ fieldId: 'xxx' }],
              },
            },
          },
        },
        spaceData
      );

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
      const evictWidget = jest.fn().mockResolvedValue(null);
      const checkAppStatus = jest.fn(() => Promise.resolve(status));

      await AppOperations.uninstall({} as MarketplaceApp, cma, checkAppStatus, evictWidget);

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
      const evictWidget = jest.fn().mockResolvedValue(null);
      const checkAppStatus = jest.fn(() => Promise.resolve(status));

      await AppOperations.uninstall({} as MarketplaceApp, cma, checkAppStatus, evictWidget);

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
      const evictWidget = jest.fn().mockResolvedValue(null);
      const checkAppStatus = jest.fn(() => Promise.resolve(status));

      expect.assertions(3);

      try {
        await AppOperations.uninstall(
          { appDefinition: status.appDefinition } as MarketplaceApp,
          cma,
          checkAppStatus,
          evictWidget
        );
      } catch (err) {
        expect(cma.deleteAppInstallation).toBeCalledWith('some-app');
        expect(err).toMatch('unauthorized');
        expect(evictWidget).not.toBeCalled();
      }
    });
  });
});
