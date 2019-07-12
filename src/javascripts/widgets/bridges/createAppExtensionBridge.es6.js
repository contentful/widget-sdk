import { isPlainObject } from 'lodash';
import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers.es6';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers.es6';
import { LOCATION_APP } from '../WidgetLocations.es6';
import * as Random from 'utils/Random.es6';

import {
  APP_UPDATE_STARTED,
  APP_EXTENSION_UPDATED,
  APP_EXTENSION_UPDATE_FAILED,
  APP_MISCONFIGURED,
  APP_CONFIGURED,
  APP_UPDATE_FAILED,
  APP_UPDATE_FINALIZED
} from 'app/settings/AppsBeta/AppHookBus.es6';

const REQUIRED_DEPENDENCIES = ['$rootScope', 'spaceContext', 'TheLocaleStore', 'appHookBus'];

export default function createAppExtensionBridge(dependencies) {
  REQUIRED_DEPENDENCIES.forEach(key => {
    if (!(key in dependencies)) {
      throw new Error(`"${key}" not provided to the extension bridge.`);
    }
  });

  const { $rootScope, spaceContext, TheLocaleStore, appHookBus } = dependencies;

  let currentInstallationRequestId = null;

  return {
    getData,
    install,
    apply: fn => $rootScope.$apply(fn)
  };

  function getData() {
    return {
      spaceId: spaceContext.getId(),
      environmentId: spaceContext.getEnvironmentId(),
      location: LOCATION_APP,
      spaceMember: spaceContext.space.data.spaceMember,
      spaceMembership: spaceContext.space.data.spaceMembership,
      current: null,
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale()
      },
      entryData: { sys: {}, fields: {} },
      contentTypeData: { sys: {}, fields: [] },
      editorInterface: undefined
    };
  }

  function install(api) {
    api.registerHandler('callSpaceMethod', makeExtensionSpaceMethodsHandlers(dependencies));
    api.registerHandler('notify', makeExtensionNotificationHandlers(dependencies));

    api.registerHandler('callAppMethod', methodName => {
      const parameters = appHookBus.getParameters();
      const isInstalled = isPlainObject(parameters);

      if (methodName === 'isInstalled') {
        return isInstalled;
      } else if (methodName === 'getParameters') {
        return isInstalled ? parameters : null;
      }
    });

    appHookBus.on(APP_UPDATE_STARTED, () => {
      if (!currentInstallationRequestId) {
        currentInstallationRequestId = Random.id();
        api.send('appHook', [
          { stage: 'preInstall', installationRequestId: currentInstallationRequestId }
        ]);
      }
    });

    appHookBus.on(APP_EXTENSION_UPDATED, ({ installationRequestId }) => {
      if (installationRequestId === currentInstallationRequestId) {
        api.send('appHook', [
          { stage: 'postInstall', installationRequestId: currentInstallationRequestId }
        ]);
      }
    });

    appHookBus.on(APP_EXTENSION_UPDATE_FAILED, ({ installationRequestId }) => {
      if (installationRequestId === currentInstallationRequestId) {
        currentInstallationRequestId = null;
      }
    });

    api.registerHandler('appHookResult', ({ installationRequestId, stage, result }) => {
      if (installationRequestId !== currentInstallationRequestId) {
        return;
      }

      if (stage === 'preInstall') {
        if (result === false) {
          appHookBus.emit(APP_MISCONFIGURED);
          currentInstallationRequestId = null;
        } else {
          appHookBus.emit(APP_CONFIGURED, { installationRequestId, parameters: result });
        }
      }

      if (stage === 'postInstall') {
        appHookBus.emit(result === false ? APP_UPDATE_FAILED : APP_UPDATE_FINALIZED);
        currentInstallationRequestId = null;
      }
    });
  }
}
