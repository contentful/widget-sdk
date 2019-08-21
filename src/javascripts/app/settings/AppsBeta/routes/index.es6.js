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
        '$state',
        (spaceContext, $state) => {
          return {
            goToContent: () => $state.go('^.^.entries.list'),
            repo: createAppsRepo(spaceContext.extensionDefinitionLoader, spaceContext.endpoint),
            productCatalog: new AppProductCatalog(spaceContext.space.data.sys.id, getSpaceFeature),
            organizationId: spaceContext.organization.sys.id,
            spaceId: spaceContext.space.data.sys.id,
            userId: spaceContext.user.sys.id
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
        'entitySelector',
        ({ appId }, spaceContext, $state, entitySelector) => {
          const repo = createAppsRepo(
            spaceContext.extensionDefinitionLoader,
            spaceContext.endpoint
          );
          const appHookBus = makeAppHookBus();

          const bridge = createAppExtensionBridge({
            spaceContext,
            appHookBus,
            entitySelector,
            Navigator,
            SlideInNavigator
          });

          return {
            goBackToList: () => $state.go('^.list'),
            productCatalog: new AppProductCatalog(spaceContext.space.data.sys.id, getSpaceFeature),
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
