import { isObject } from 'lodash';
import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers';
import makePageExtensionHandlers from './makePageExtensionHandlers';
import makeExtensionDialogsHandler from './makeExtensionDialogsHandlers';
import checkDependencies from './checkDependencies';
import { LOCATION_APP } from '../WidgetLocations';
import * as Random from 'utils/Random';
import TheLocaleStore from 'services/localeStore';

import { APP_EVENTS_IN, APP_EVENTS_OUT } from 'app/settings/AppsBeta/AppHookBus';
import getCurrentAppState from 'app/settings/AppsBeta/AppCurrentState';

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
      const installation = appHookBus.getInstallation();
      const isInstalled = isObject(installation);

      if (methodName === 'isInstalled') {
        return isInstalled;
      } else if (methodName === 'getParameters' && isInstalled) {
        return installation.parameters;
      } else if (methodName === 'getCurrentState' && isInstalled) {
        return getCurrentAppState(spaceContext.cma, installation.sys.widgetId);
      } else if (methodName === 'setReady') {
        return appHookBus.emit(APP_EVENTS_IN.MARKED_AS_READY);
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

          // This is useful because it will ensure that the user will see
          // any updates made to content types after they navigate away from the app page.
          spaceContext.publishedCTs.refresh();
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
