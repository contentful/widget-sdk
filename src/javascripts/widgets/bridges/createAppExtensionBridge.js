import { isObject } from 'lodash';
import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers';
import makePageExtensionHandlers from './makePageExtensionHandlers';
import makeExtensionDialogsHandler from './makeExtensionDialogsHandlers';
import makeExtensionAccessHandlers from './makeExtensionAccessHandlers';
import checkDependencies from './checkDependencies';
import { LOCATION_APP_CONFIG } from '../WidgetLocations';
import * as Random from 'utils/Random';
import TheLocaleStore from 'services/localeStore';

import { APP_EVENTS_IN, APP_EVENTS_OUT } from 'app/Apps/AppHookBus';

const STAGE_PRE_INSTALL = 'preInstall';
const STAGE_POST_INSTALL = 'postInstall';

export default function createAppExtensionBridge(dependencies) {
  const { spaceContext, appHookBus } = checkDependencies('AppExtensionBridge', dependencies, [
    'spaceContext',
    'appHookBus',
    'currentWidgetId',
    'currentWidgetNamespace',
  ]);

  let currentInstallationRequestId = null;

  return {
    getData,
    install,
    uninstall: () => {},
    apply: (fn) => fn(),
  };

  function getData() {
    return {
      spaceId: spaceContext.getId(),
      environmentId: spaceContext.getEnvironmentId(),
      location: LOCATION_APP_CONFIG,
      spaceMember: spaceContext.space.data.spaceMember,
      current: null,
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale(),
      },
      entryData: { sys: {}, fields: {} },
      contentTypeData: { sys: {}, fields: [] },
      initialContentTypesData: spaceContext.publishedCTs.getAllBare(),
      editorInterface: undefined,
    };
  }

  function install(api) {
    api.registerHandler('openDialog', makeExtensionDialogsHandler(dependencies));
    api.registerHandler('notify', makeExtensionNotificationHandlers(dependencies));
    api.registerHandler('callSpaceMethod', makeExtensionSpaceMethodsHandlers(dependencies));
    api.registerHandler('navigateToPage', makePageExtensionHandlers(dependencies));
    api.registerHandler('checkAccess', makeExtensionAccessHandlers());

    api.registerHandler('callAppMethod', (methodName) => {
      const installation = appHookBus.getInstallation();
      const isInstalled = isObject(installation);

      if (methodName === 'setReady') {
        return appHookBus.emit(APP_EVENTS_IN.MARKED_AS_READY);
      } else if (methodName === 'isInstalled') {
        return isInstalled;
      } else if (methodName === 'getParameters' && isInstalled) {
        return installation.parameters;
      } else {
        return null;
      }
    });

    const preInstall = () => {
      if (currentInstallationRequestId) {
        // Installation in progress already, ignore.
        return;
      }

      currentInstallationRequestId = Random.id();

      api.send('appHook', [
        {
          stage: STAGE_PRE_INSTALL,
          installationRequestId: currentInstallationRequestId,
        },
      ]);
    };

    const makePostInstall = (err) => ({ installationRequestId }) => {
      if (installationRequestId !== currentInstallationRequestId) {
        // Message coming from a different installation process, ignore.
        return;
      }

      api.send('appHook', [
        {
          stage: STAGE_POST_INSTALL,
          installationRequestId: currentInstallationRequestId,
          err: err || null,
        },
      ]);

      currentInstallationRequestId = null;

      // We cache published content types heavily in the Web App.
      // Refresh the cache since the app could create/update content types.
      spaceContext.publishedCTs.refresh();
    };

    appHookBus.on(APP_EVENTS_OUT.STARTED, preInstall);
    appHookBus.on(APP_EVENTS_OUT.SUCCEEDED, makePostInstall(null));
    appHookBus.on(
      APP_EVENTS_OUT.FAILED,
      makePostInstall({ message: 'Failed to configure the app' })
    );

    api.registerHandler('appHookResult', ({ installationRequestId, stage, result }) => {
      if (installationRequestId !== currentInstallationRequestId) {
        // Message coming from a different installation process, ignore.
        return;
      }

      if (stage !== STAGE_PRE_INSTALL) {
        // We only handle results of pre install hooks, abort.
        return;
      }

      if (result === false) {
        appHookBus.emit(APP_EVENTS_IN.MISCONFIGURED);
        currentInstallationRequestId = null;
      } else {
        appHookBus.emit(APP_EVENTS_IN.CONFIGURED, { installationRequestId, config: result });
      }
    });
  }
}
