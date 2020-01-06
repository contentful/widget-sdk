import { get } from 'lodash';
import AppsListPage from '../AppsListPage';
import AppPage from '../AppPage';
import { AppProductCatalog } from '../AppProductCatalog';
import { makeAppHookBus } from '../AppHookBus';
import createAppExtensionBridge from 'widgets/bridges/createAppExtensionBridge';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index';
import { getAppsRepo } from '../AppsRepoInstance';
import { getSpaceFeature } from 'data/CMA/ProductCatalog';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { NAMESPACE_EXTENSION, NAMESPACE_APP } from 'widgets/WidgetNamespaces';

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
            repo: getAppsRepo(),
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
      params: {
        acceptedPermissions: null
      },
      component: AppPage,
      resolve: {
        // Define dependency on spaceContext so we load the app
        // only when the space is initialized.
        app: ['$stateParams', 'spaceContext', ({ appId }) => getAppsRepo().getApp(appId)]
      },
      onEnter: [
        '$state',
        '$stateParams',
        'spaceContext',
        'app',
        ($state, $stateParams, spaceContext, app) => {
          // No need to consent for private apps.
          if (app.isPrivateApp) {
            // Allow to continue page rendering.
            return;
          }

          // If an app is not installed and permissions were not accepted
          // we display the app dialog so consent can be given.
          if (!app.appInstallation && !$stateParams.acceptedPermissions) {
            // When executing `onEnter` after a page refresh
            // the current state won't be initialized. For this reason
            // we need to compute params and an absolute path manually.
            const params = {
              spaceId: spaceContext.getId(),
              appId: app.id // Passing this param will open the app dialog.
            };

            let absoluteListPath = 'spaces.detail.apps.list';
            if (!spaceContext.isMasterEnvironment()) {
              params.environmentId = spaceContext.getEnvironmentId();
              absoluteListPath = 'spaces.detail.environment.apps.list';
            }

            $state.go(absoluteListPath, params);
          }
        }
      ],
      mapInjectedToProps: [
        'spaceContext',
        '$state',
        'app',
        (spaceContext, $state, app) => {
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
            app,
            bridge,
            appHookBus,
            cma: spaceContext.cma,
            evictWidget: appInstallation => {
              const loader = getCustomWidgetLoader();
              const sys = get(appInstallation, ['sys']);

              // TODO: we evict both legacy "apps as extensions"
              // and regular "apps from the app namespace".
              // When we migrate data we should only evict the latter.
              loader.evict([NAMESPACE_EXTENSION, get(sys, ['widgetId'])]);
              loader.evict([NAMESPACE_APP, get(sys, ['appDefinition', 'sys', 'id'])]);
            }
          };
        }
      ]
    }
  ]
};
