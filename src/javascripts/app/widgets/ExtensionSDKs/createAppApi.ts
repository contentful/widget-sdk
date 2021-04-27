import { AppConfigAPI } from '@contentful/app-sdk';
import { WidgetNamespace, AppStages } from '@contentful/widget-renderer';
import { getCurrentState } from 'features/apps';
import { APP_EVENTS_IN, APP_EVENTS_OUT, AppHookBus } from 'features/apps-core';
import { isObject } from 'lodash';
import APIClient from 'data/APIClient';
import { GlobalEventBus, GlobalEvents } from 'core/services/GlobalEventsBus';

export type AppHookListener = (stage: AppStages, result: any) => void;

export function createAppApi({
  widgetId,
  widgetNamespace,
  cma,
  appHookBus,
}: {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  cma: APIClient;
  appHookBus: AppHookBus;
}): { appApi: AppConfigAPI; onAppHook: AppHookListener } {
  appHookBus.on(APP_EVENTS_OUT.STARTED, preInstall);
  appHookBus.on(APP_EVENTS_OUT.SUCCEEDED, makePostInstall(null));
  appHookBus.on(APP_EVENTS_OUT.FAILED, makePostInstall({ message: 'Failed to configure the app' }));

  const configureHandlers: Function[] = [];
  const configurationCompleteHandlers: Function[] = [];

  const appApi = {
    setReady: async () => {
      appHookBus.emit(APP_EVENTS_IN.MARKED_AS_READY);
    },
    isInstalled: async () => {
      const installation = appHookBus.getInstallation();
      return isObject(installation);
    },
    getCurrentState: async () => {
      const installation = appHookBus.getInstallation();
      const isInstalled = isObject(installation);

      return isInstalled ? getCurrentState(cma, widgetId, widgetNamespace) : null;
    },
    getParameters: async () => {
      const installation = appHookBus.getInstallation();
      const isInstalled = isObject(installation);

      return isInstalled ? installation?.parameters : null;
    },
    onConfigure: async (handler: Function) => {
      configureHandlers.push(handler);
    },
    onConfigurationCompleted: async (handler: Function) => {
      configurationCompleteHandlers.push(handler);
    },
  };

  const onAppHook = (stage: AppStages, result: any) => {
    if (stage !== AppStages.PreInstall) {
      // We only handle results of pre install hooks, abort.
      return;
    }

    if (result === false) {
      appHookBus.emit(APP_EVENTS_IN.MISCONFIGURED);
    } else {
      appHookBus.emit(APP_EVENTS_IN.CONFIGURED, { config: result });
    }
  };

  return {
    appApi,
    onAppHook,
  };

  function preInstall() {
    configureHandlers.forEach((handler) => handler());
  }

  function makePostInstall(err: any) {
    return () => {
      configurationCompleteHandlers.forEach((handler) => handler(err));

      // We cache published content types heavily in the Web App.
      // Refresh the cache since the app could create/update content types.
      GlobalEventBus.emit(GlobalEvents.RefreshPublishedContentTypes);
    };
  }
}
