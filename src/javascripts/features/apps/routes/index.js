/* eslint-disable rulesdir/allow-only-import-export-in-index, import/no-default-export */
import { get } from 'lodash';
import { AppsListPage } from '../AppsListPage';
import { AppRoute } from '../AppPage';
import { AppPageLocation } from '../AppPageLocation';
import { makeAppHookBus, getAppsRepo } from 'features/apps-core';
import createAppExtensionBridge from 'widgets/bridges/createAppExtensionBridge';
import createPageExtensionBridge from 'widgets/bridges/createPageExtensionBridge';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index';
import { getSpaceFeature } from 'data/CMA/ProductCatalog';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { shouldHide, Action } from 'access_control/AccessChecker';
import * as TokenStore from 'services/TokenStore';
import { isOwnerOrAdmin, isDeveloper } from 'services/OrganizationRoles';
import { WidgetNamespace } from 'features/widget-renderer';

const BASIC_APPS_FEATURE_KEY = 'basic_apps';
const DEFAULT_FEATURE_STATUS = true; // Fail open

function canUserManageApps() {
  return !shouldHide(Action.UPDATE, 'settings');
}

const appsFeatureResolver = [
  'spaceContext',
  async (spaceContext) => {
    try {
      return getSpaceFeature(spaceContext.getId(), BASIC_APPS_FEATURE_KEY, DEFAULT_FEATURE_STATUS);
    } catch (err) {
      return DEFAULT_FEATURE_STATUS;
    }
  },
];

export const appRoute = {
  name: 'apps',
  url: '/apps',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      params: {
        appId: null,
        referrer: null,
      },
      resolve: {
        hasAppsFeature: appsFeatureResolver,
      },
      component: AppsListPage,
      mapInjectedToProps: [
        'spaceContext',
        '$state',
        '$stateParams',
        'hasAppsFeature',
        (spaceContext, $state, $stateParams, hasAppsFeature) => {
          return {
            goToContent: () => $state.go('^.^.entries.list'),
            repo: getAppsRepo(),
            hasAppsFeature,
            organizationId: spaceContext.organization.sys.id,
            spaceInformation: {
              spaceId: spaceContext.space.data.sys.id,
              spaceName: spaceContext.space.data.name,
              envMeta: spaceContext.space.environmentMeta,
            },
            userId: spaceContext.user.sys.id,
            canManageApps: canUserManageApps(),
            deeplinkAppId: $stateParams.appId || null,
            deeplinkReferrer: $stateParams.referrer || null,
          };
        },
      ],
    },
    {
      name: 'detail',
      url: '/:appId',
      params: {
        acceptedPermissions: null,
      },
      component: AppRoute,
      resolve: {
        // Define dependency on spaceContext so we load the app
        // only when the space is initialized.
        app: ['$stateParams', 'spaceContext', ({ appId }) => getAppsRepo().getApp(appId)],
        hasAppsFeature: appsFeatureResolver,
        canManageThisApp: [
          'app',
          'spaceContext',
          async ({ appDefinition }, { organization }) => {
            const sameOrg = organization.sys.id === appDefinition.sys.organization.sys.id;
            const org = await TokenStore.getOrganization(organization.sys.id);
            const isDeveloperOrHigher = isOwnerOrAdmin(org) || isDeveloper(org);

            return sameOrg && isDeveloperOrHigher;
          },
        ],
      },
      onEnter: [
        '$state',
        '$stateParams',
        'spaceContext',
        'app',
        'hasAppsFeature',
        ($state, $stateParams, spaceContext, app, hasAppsFeature) => {
          // No need to consent for private apps.
          if (app.isPrivateApp) {
            // Allow to continue page rendering.
            return;
          }

          // If an app is not installed and permissions were not accepted
          // we display the app dialog so consent can be given.
          const installingWithoutConsent =
            !app.appInstallation && !$stateParams.acceptedPermissions;

          if (!canUserManageApps() || !hasAppsFeature || installingWithoutConsent) {
            // When executing `onEnter` after a page refresh
            // the current state won't be initialized. For this reason
            // we need to compute params and an absolute path manually.
            const params = { spaceId: spaceContext.getId() };

            if (hasAppsFeature) {
              // Passing this param will open the app dialog.
              params.appId = app.id;
            }

            let absoluteListPath = 'spaces.detail.apps.list';
            if (!spaceContext.isMasterEnvironment()) {
              params.environmentId = spaceContext.getEnvironmentId();
              absoluteListPath = 'spaces.detail.environment.apps.list';
            }

            $state.go(absoluteListPath, params);
          }
        },
      ],
      mapInjectedToProps: [
        'spaceContext',
        '$state',
        'app',
        'canManageThisApp',
        (spaceContext, $state, app, canManageThisApp) => {
          const appHookBus = makeAppHookBus();

          const bridge = createAppExtensionBridge({
            spaceContext,
            appHookBus,
            Navigator,
            SlideInNavigator,
            appDefinition: app.appDefinition,
            currentWidgetId: app.appDefinition.sys.id,
            currentWidgetNamespace: WidgetNamespace.APP,
          });

          return {
            goBackToList: () => $state.go('^.list'),
            app,
            bridge,
            appHookBus,
            cma: spaceContext.cma,
            evictWidget: async (appInstallation) => {
              const loader = await getCustomWidgetLoader();

              loader.evict({
                widgetNamespace: WidgetNamespace.APP,
                widgetId: get(appInstallation, ['sys', 'appDefinition', 'sys', 'id']),
              });
            },
            canManageThisApp,
          };
        },
      ],
    },
    {
      name: 'page',
      url: '/app_installations/:appId{path:PathSuffix}',
      component: AppPageLocation,
      resolve: {
        app: ['$stateParams', 'spaceContext', ({ appId }) => getAppsRepo().getApp(appId)],
      },
      onEnter: [
        'app',
        (app) => {
          const noPageLocationDefined = !app.appDefinition.locations.find(
            (l) => l.location === 'page'
          );

          if (noPageLocationDefined) {
            throw new Error('This app has not defined a page location!');
          }
        },
      ],
      mapInjectedToProps: [
        '$stateParams',
        'spaceContext',
        'app',
        ({ path = '' }, spaceContext, app) => {
          const bridge = createPageExtensionBridge({
            spaceContext,
            Navigator,
            SlideInNavigator,
            appDefinition: app.appDefinition,
            currentWidgetId: app.id,
            currentWidgetNamespace: WidgetNamespace.APP,
          });

          return {
            path: path.startsWith('/') ? path : `/${path}`,
            app,
            bridge,
            cma: spaceContext.cma,
          };
        },
      ],
    },
  ],
};
