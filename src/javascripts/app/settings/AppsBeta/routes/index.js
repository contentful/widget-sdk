import AppsListPage from '../AppsListPage';
import AppPage from '../AppPage';
import { AppProductCatalog } from '../AppProductCatalog';
import { makeAppHookBus } from '../AppHookBus';
import createAppExtensionBridge from 'widgets/bridges/createAppExtensionBridge';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator';
import createAppsRepo from '../AppsRepo';
import { getSpaceFeature } from 'data/CMA/ProductCatalog';

export default {
  name: 'apps',
  url: '/apps',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      params: {
        appId: null,
        referrer: null
      },
      component: AppsListPage,
      mapInjectedToProps: [
        'spaceContext',
        '$state',
        '$stateParams',
        (spaceContext, $state, $stateParams) => {
          return {
            goToContent: () => $state.go('^.^.entries.list'),
            repo: createAppsRepo(spaceContext.appDefinitionLoader, spaceContext.endpoint),
            productCatalog: new AppProductCatalog(spaceContext.space.data.sys.id, getSpaceFeature),
            organizationId: spaceContext.organization.sys.id,
            spaceId: spaceContext.space.data.sys.id,
            userId: spaceContext.user.sys.id,
            deeplinkAppId: $stateParams.appId || null,
            deeplinkReferrer: $stateParams.referrer || null
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
        'spaceContext',
        '$state',
        ({ appId }, spaceContext, $state) => {
          const repo = createAppsRepo(spaceContext.appDefinitionLoader, spaceContext.endpoint);
          const appHookBus = makeAppHookBus();

          const bridge = createAppExtensionBridge({
            spaceContext,
            appHookBus,
            Navigator,
            SlideInNavigator
          });

          const productCatalog = new AppProductCatalog(
            spaceContext.space.data.sys.id,
            getSpaceFeature
          );

          return {
            goBackToList: () => $state.go('^.list'),
            productCatalog,
            appId,
            repo,
            bridge,
            appHookBus,
            cma: spaceContext.cma,
            extensionLoader: spaceContext.extensionLoader
          };
        }
      ]
    }
  ]
};
