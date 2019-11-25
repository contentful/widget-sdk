import AppsListPage from '../AppsListPage';
import AppPage from '../AppPage';
import { AppProductCatalog } from '../AppProductCatalog';
import { makeAppHookBus } from '../AppHookBus';
import createAppExtensionBridge from 'widgets/bridges/createAppExtensionBridge';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index';
import createAppsRepo from '../AppsRepo';
import { getSpaceFeature } from 'data/CMA/ProductCatalog';
import { getAppDefinitionLoader } from 'app/settings/AppsBeta/AppDefinitionLoaderInstance';
import { getExtensionLoader } from 'widgets/ExtensionLoaderInstance';

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
            repo: createAppsRepo(getAppDefinitionLoader(), spaceContext.endpoint),
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
      resolve: {
        repo: [
          'spaceContext',
          ({ endpoint }) => createAppsRepo(getAppDefinitionLoader(), endpoint)
        ],
        app: [
          '$stateParams',
          'repo',
          async ({ appId }, repo) => {
            const apps = await repo.getApps();
            return apps.find(app => app.id === appId);
          }
        ]
      },
      mapInjectedToProps: [
        'spaceContext',
        '$state',
        'repo',
        'app',
        (spaceContext, $state, repo, app) => {
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

          const extensionLoader = getExtensionLoader();

          return {
            goBackToList: () => $state.go('^.list'),
            productCatalog,
            app,
            repo,
            bridge,
            appHookBus,
            cma: spaceContext.cma,
            evictWidget: id => extensionLoader.evictExtension(id)
          };
        }
      ]
    }
  ]
};
