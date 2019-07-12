import AppsListPage from './AppsListPage.es6';
import AppPage from './AppPage.es6';
import { makeAppHookBus } from './AppHookBus.es6';
import createAppExtensionBridge from 'widgets/bridges/createAppExtensionBridge.es6';
import TheLocaleStore from 'services/localeStore.es6';

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
        '$state',
        ({ appId }, $rootScope, spaceContext, $state) => {
          const appHookBus = makeAppHookBus();

          const bridge = createAppExtensionBridge({
            $rootScope,
            spaceContext,
            TheLocaleStore,
            appHookBus
          });

          return {
            goBackToList: () => $state.go('^.list'),
            spaceId: spaceContext.getId(),
            environmentId: spaceContext.getEnvironmentId(),
            appId,
            bridge,
            appHookBus,
            cma: spaceContext.cma
          };
        }
      ]
    }
  ]
};
