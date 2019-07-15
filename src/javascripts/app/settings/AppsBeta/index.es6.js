import AppsListPage from './AppsListPage.es6';
import AppPage from './AppPage.es6';
import { makeAppHookBus } from './AppHookBus.es6';
import createAppExtensionBridge from 'widgets/bridges/createAppExtensionBridge.es6';
import * as Navigator from 'states/Navigator.es6';
import TheLocaleStore from 'services/localeStore.es6';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index.es6';

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
        'entitySelector',
        ({ appId }, $rootScope, spaceContext, $state, entitySelector) => {
          const appHookBus = makeAppHookBus();

          const bridge = createAppExtensionBridge({
            $rootScope,
            spaceContext,
            TheLocaleStore,
            appHookBus,
            entitySelector,
            Navigator,
            SlideInNavigator
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
