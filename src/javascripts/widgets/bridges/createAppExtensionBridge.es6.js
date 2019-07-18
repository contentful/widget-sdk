import { isPlainObject } from 'lodash';
import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers.es6';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers.es6';
import makePageExtensionHandlers from './makePageExtensionHandlers.es6';
import makeExtensionDialogsHandler from './makeExtensionDialogsHandlers.es6';
import checkDependencies from './checkDependencies.es6';
import { LOCATION_APP } from '../WidgetLocations.es6';
import * as Random from 'utils/Random.es6';

import { APP_EVENTS_IN, APP_EVENTS_OUT } from 'app/settings/AppsBeta/AppHookBus.es6';

const STAGE_PRE_INSTALL = 'preInstall';
const STAGE_POST_INSTALL = 'postInstall';

export default function createAppExtensionBridge(dependencies) {
  const { $rootScope, spaceContext, TheLocaleStore, appHookBus } = checkDependencies(
    'AppExtensionBridge',
    dependencies,
    ['$rootScope', 'spaceContext', 'TheLocaleStore', 'appHookBus']
  );

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
    api.registerHandler('openDialog', makeExtensionDialogsHandler(dependencies));
    api.registerHandler('notify', makeExtensionNotificationHandlers(dependencies));
    api.registerHandler('navigateToPageExtension', makePageExtensionHandlers(dependencies));

    api.registerHandler(
      'callSpaceMethod',
      makeExtensionSpaceMethodsHandlers(dependencies, { readOnly: true })
    );

    api.registerHandler('callAppMethod', methodName => {
      const parameters = appHookBus.getParameters();
      const isInstalled = isPlainObject(parameters);

      if (methodName === 'isInstalled') {
        return isInstalled;
      } else if (methodName === 'getParameters') {
        return isInstalled ? parameters : null;
      }
    });

    const preInstallMessage = () => ({
      stage: STAGE_PRE_INSTALL,
      installationRequestId: currentInstallationRequestId
    });

    const postInstallMessage = ok => ({
      ok,
      stage: STAGE_POST_INSTALL,
      installationRequestId: currentInstallationRequestId
    });

    const postInstall = ok => {
      return ({ installationRequestId }) => {
        if (installationRequestId === currentInstallationRequestId) {
          api.send('appHook', [postInstallMessage(ok)]);
          currentInstallationRequestId = null;
        }
      };
    };

    appHookBus.on(APP_EVENTS_OUT.STARTED, () => {
      if (!currentInstallationRequestId) {
        currentInstallationRequestId = Random.id();
        api.send('appHook', [preInstallMessage()]);
      }
    });

    appHookBus.on(APP_EVENTS_OUT.FAILED, postInstall(false));
    appHookBus.on(APP_EVENTS_OUT.SUCCEEDED, postInstall(true));

    api.registerHandler('appHookResult', ({ installationRequestId, stage, result }) => {
      if (installationRequestId !== currentInstallationRequestId) {
        return;
      }

      if (stage !== STAGE_PRE_INSTALL) {
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
