import AppsListPage from '../AppsListPage.es6';
import AppPage from '../AppPage.es6';
import { AppProductCatalog } from '../AppProductCatalog.es6';
import { makeAppHookBus } from '../AppHookBus.es6';
import createAppExtensionBridge from 'widgets/bridges/createAppExtensionBridge.es6';
import * as Navigator from 'states/Navigator.es6';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index.es6';
import createAppsRepo from '../AppsRepo.es6';
import { getSpaceFeature } from 'data/CMA/ProductCatalog.es6';

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
            repo: createAppsRepo(spaceContext.extensionDefinitionLoader, spaceContext.endpoint),
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
          const repo = createAppsRepo(
            spaceContext.extensionDefinitionLoader,
            spaceContext.endpoint
          );
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
