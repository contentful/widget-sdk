import AppsListPage from './AppsListPage.es6';
import AppPage from './AppPage.es6';
import createAppExtensionBridge from 'widgets/bridges/createAppExtensionBridge.es6';
import TheLocaleStore from 'services/localeStore.es6';
import mitt from 'mitt';

const APPS_EVENTS = {
  APP_UPDATE_STARTED: 'app-update-started',
  APP_CONFIGURED: 'app-configured',
  APP_MISCONFIGURED: 'app-misconfigured',
  APP_EXTENSION_UPDATED: 'app-extension-updated',
  APP_EXTENSION_UPDATE_FAILED: 'app-extension-update-failed',
  APP_UPDATE_FINALIZED: 'app-update-finalized',
  APP_UPDATE_FAILED: 'app-update-failed'
};

function makeAppBus() {
  const appBus = mitt();

  appBus.on('*', (type, event) => {
    // eslint-disable-next-line
    console.log(type, event);
  });

  appBus.parameters = null;
  appBus.EVENTS = APPS_EVENTS;

  return appBus;
}

export default {
  name: 'appsBeta',
  url: '/apps_beta',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: AppsListPage,
      mapInjectedToProps: [
        'spaceContext',
        spaceContext => {
          return {
            spaceId: spaceContext.getId(),
            environmentId: spaceContext.getEnvironmentId()
          };
        }
      ]
    },
    {
      name: 'detail',
      url: '/:appId',
      component: AppPage,
      mapInjectedToProps: [
        '$stateParams',
        '$rootScope',
        'spaceContext',
        ({ appId }, $rootScope, spaceContext) => {
          const appBus = makeAppBus();

          const bridge = createAppExtensionBridge({
            $rootScope,
            spaceContext,
            TheLocaleStore,
            appBus
          });

          return {
            spaceId: spaceContext.getId(),
            environmentId: spaceContext.getEnvironmentId(),
            appId,
            bridge,
            appBus,
            cma: spaceContext.cma
          };
        }
      ]
    }
  ]
};
