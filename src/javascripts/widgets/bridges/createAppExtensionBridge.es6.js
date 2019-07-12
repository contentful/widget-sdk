import { isPlainObject } from 'lodash';
import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers.es6';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers.es6';
import { LOCATION_APP } from '../WidgetLocations.es6';
import * as Random from 'utils/Random.es6';

const REQUIRED_DEPENDENCIES = ['$rootScope', 'spaceContext', 'TheLocaleStore', 'appBus'];

export default function createAppExtensionBridge(dependencies) {
  REQUIRED_DEPENDENCIES.forEach(key => {
    if (!(key in dependencies)) {
      throw new Error(`"${key}" not provided to the extension bridge.`);
    }
  });

  const { $rootScope, spaceContext, TheLocaleStore, appBus } = dependencies;

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
      const isInstalled = isPlainObject(appBus.parameters);
      if (methodName === 'isInstalled') {
        return isInstalled;
      } else if (methodName === 'getParameters') {
        return isInstalled ? appBus.parameters : null;
      }
    });

    appBus.on(appBus.EVENTS.APP_UPDATE_STARTED, () => {
      if (!currentInstallationRequestId) {
        currentInstallationRequestId = Random.id();
        api.send('appHook', [
          { stage: 'preInstall', installationRequestId: currentInstallationRequestId }
        ]);
      }
    });

    appBus.on(appBus.EVENTS.APP_EXTENSION_UPDATED, ({ installationRequestId }) => {
      if (installationRequestId === currentInstallationRequestId) {
        api.send('appHook', [
          { stage: 'postInstall', installationRequestId: currentInstallationRequestId }
        ]);
      }
    });

    appBus.on(appBus.EVENTS.APP_EXTENSION_UPDATE_FAILED, ({ installationRequestId }) => {
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
          appBus.emit(appBus.EVENTS.APP_MISCONFIGURED);
          currentInstallationRequestId = null;
        } else {
          appBus.emit(appBus.EVENTS.APP_CONFIGURED, { installationRequestId, parameters: result });
        }
      }

      if (stage === 'postInstall') {
        if (result === false) {
          appBus.emit(appBus.EVENTS.APP_UPDATE_FAILED);
        } else {
          appBus.emit(appBus.EVENTS.APP_UPDATE_FINALIZED);
        }
        currentInstallationRequestId = null;
      }
    });
  }
}
