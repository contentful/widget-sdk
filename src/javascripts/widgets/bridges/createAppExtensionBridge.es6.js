import { isObject } from 'lodash';
import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers.es6';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers.es6';
import makePageExtensionHandlers from './makePageExtensionHandlers.es6';
import makeExtensionDialogsHandler from './makeExtensionDialogsHandlers.es6';
import checkDependencies from './checkDependencies.es6';
import { LOCATION_APP } from '../WidgetLocations.es6';
import * as Random from 'utils/Random.es6';
import TheLocaleStore from 'services/localeStore.es6';

import { APP_EVENTS_IN, APP_EVENTS_OUT } from 'app/settings/AppsBeta/AppHookBus.es6';
import getCurrentAppState from 'app/settings/AppsBeta/AppCurrentState.es6';

const STAGE_PRE_INSTALL = 'preInstall';
const STAGE_POST_INSTALL = 'postInstall';

export default function createAppExtensionBridge(dependencies) {
  const { spaceContext, appHookBus } = checkDependencies('AppExtensionBridge', dependencies, [
    'spaceContext',
    'appHookBus'
  ]);

  let currentInstallationRequestId = null;

  return {
    getData,
    install,
    apply: fn => fn()
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

    // TODO: consider `readOnly: true` for "app" location.
    // Right now we create all the apps but in the future we want to open
    // the framework. If we do so, we want to prevent apps from messing with
    // a space before they are installed.
    api.registerHandler('callSpaceMethod', makeExtensionSpaceMethodsHandlers(dependencies));

    api.registerHandler('callAppMethod', methodName => {
      const extension = appHookBus.getExtension();
      const isInstalled = isObject(extension);

      if (methodName === 'isInstalled') {
        return isInstalled;
      } else if (methodName === 'getParameters' && isInstalled) {
        return extension.parameters;
      } else if (methodName === 'getCurrentState' && isInstalled) {
        return getCurrentAppState(spaceContext.cma, extension.sys.id);
      } else {
        return null;
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
