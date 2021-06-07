import { AppConfigAPI } from '@contentful/app-sdk';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { createAppApi } from './createAppApi';
import { APP_EVENTS_IN, APP_EVENTS_OUT, makeAppHookBus } from 'features/apps-core';
import { AppHookBus } from '@contentful/experience-sdk';
import APIClient from 'data/APIClient';

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'chrome' }),
}));

jest.mock('core/NgRegistry', () => ({
  getModule: () => ({
    $emit: jest.fn(),
  }),
}));

describe('createAppApi', () => {
  const widgetId = 'w-id';
  const widgetNamespace = WidgetNamespace.APP;
  const cma = {
    getEditorInterfaces: jest.fn(),
  } as unknown as APIClient;

  const buildApi = (appHookBus = makeAppHookBus()) => ({
    result: createAppApi({ widgetId, widgetNamespace, cma, appHookBus }),
    appHookBus,
  });

  const mockAppHookBus: AppHookBus = {
    on: jest.fn(),
    emit: jest.fn(),
    setInstallation: jest.fn(),
    getInstallation: jest.fn(),
  };

  describe('returns an appApi', () => {
    describe('setReady', () => {
      it('emits an event to appHookBus', async () => {
        const { appApi } = buildApi(mockAppHookBus).result;
        await appApi.setReady();
        expect(mockAppHookBus.emit).toHaveBeenCalledWith(APP_EVENTS_IN.MARKED_AS_READY);
      });
    });

    describe('isInstalled', () => {
      describe('when the app is installed', () => {
        it('resolves to true', async () => {
          (mockAppHookBus.getInstallation as jest.Mock).mockReturnValueOnce({ it: 'is installed' });
          const { appApi } = buildApi(mockAppHookBus).result;

          const installed = await appApi.isInstalled();
          expect(installed).toBe(true);
        });
      });

      describe("when the app isn't installed", () => {
        it('resolves to false', async () => {
          const { appApi } = buildApi(mockAppHookBus).result;
          (mockAppHookBus.getInstallation as jest.Mock).mockReturnValueOnce(null);
          const installed = await appApi.isInstalled();
          expect(installed).toBe(false);
        });
      });
    });

    describe('onConfigure', () => {
      it('registers a handler that is called when installation starts', () => {
        const {
          result: { appApi },
          appHookBus,
        } = buildApi();

        const fn: jest.Mock = jest.fn();
        appApi.onConfigure(fn);

        expect(fn).not.toHaveBeenCalled();

        appHookBus.emit(APP_EVENTS_OUT.STARTED);

        expect(fn).toHaveBeenCalled();
      });
    });

    describe('onConfigurationCompleted', () => {
      let appApi: AppConfigAPI;
      let appHookBus: AppHookBus;
      let fn: jest.Mock;
      beforeEach(() => {
        const built = buildApi();
        appApi = built.result.appApi;
        appHookBus = built.appHookBus;
        fn = jest.fn();
        appApi.onConfigurationCompleted(fn);
      });

      describe('registers a handler', () => {
        it('is called when installation succeeds', () => {
          expect(fn).not.toHaveBeenCalled();

          appHookBus.emit(APP_EVENTS_OUT.SUCCEEDED);

          expect(fn).toHaveBeenCalledWith(null);
        });

        it('is called with an error when installation fails', () => {
          expect(fn).not.toHaveBeenCalled();

          appHookBus.emit(APP_EVENTS_OUT.FAILED);

          expect(fn).toHaveBeenCalledWith({ message: 'Failed to configure the app' });
        });
      });
    });
  });
});
