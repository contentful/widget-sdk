/* eslint-disable rulesdir/allow-only-import-export-in-index, import/no-default-export */
import { get, memoize } from 'lodash';
import { AppsListPage } from '../AppsListPage';
import { AppRoute } from '../AppPage';
import { makeAppHookBus, getAppsRepo } from 'features/apps-core';
import createAppExtensionBridge from 'widgets/bridges/createAppExtensionBridge';
import { createAppExtensionSDK } from 'app/widgets/ExtensionSDKs';
import createPageExtensionBridge from 'widgets/bridges/createPageExtensionBridge';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index';
import { getSpaceFeature, getOrgFeature } from 'data/CMA/ProductCatalog';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { shouldHide, Action } from 'access_control/AccessChecker';
import * as TokenStore from 'services/TokenStore';
import { isOwnerOrAdmin, isDeveloper } from 'services/OrganizationRoles';
import { Widget, WidgetLocation, WidgetNamespace } from '@contentful/widget-renderer';
import { getCurrentState } from 'features/apps/AppState';
import { createPageWidgetSDK } from 'app/widgets/ExtensionSDKs/createPageWidgetSDK';
import { PageWidgetRenderer } from '../PageWidgetRenderer';
import { FLAGS, getVariation } from 'LaunchDarkly';

const BASIC_APPS_FEATURE_KEY = 'basic_apps';
const DEFAULT_FEATURE_STATUS = true; // Fail open
const ADVANCED_APPS_FEATURE_KEY = 'advanced_apps';
const DEFAULT_ADVANCED_APPS_STATUS = false;

function canUserManageApps() {
  return !shouldHide(Action.UPDATE, 'settings');
}

const appsFeatureResolver = [
  'spaceContext',
  async (spaceContext) => {
    try {
      return await getSpaceFeature(spaceContext.getId(), BASIC_APPS_FEATURE_KEY, DEFAULT_FEATURE_STATUS);
    } catch (err) {
      return DEFAULT_FEATURE_STATUS;
    }
  },
];

const advancedAppsFeatureResolver = [
  'spaceContext',
  async (spaceContext) => {
    try {
      const orgId = spaceContext.organization.sys.id;
      return await getOrgFeature(orgId, ADVANCED_APPS_FEATURE_KEY, DEFAULT_ADVANCED_APPS_STATUS);
    } catch (err) {
      return DEFAULT_ADVANCED_APPS_STATUS;
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
        hasAdvancedAppsFeature: advancedAppsFeatureResolver,
      },
      component: AppsListPage,
      mapInjectedToProps: [
        'spaceContext',
        '$state',
        '$stateParams',
        'hasAppsFeature',
        'hasAdvancedAppsFeature',
        (
          spaceContext,
          $state,
          $stateParams,
          hasAppsFeature: boolean,
          hasAdvancedAppsFeature: boolean
        ) => {
          return {
            goToContent: () => $state.go('^.^.entries.list'),
            repo: getAppsRepo(),
            hasAppsFeature,
            hasAdvancedAppsFeature,
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
        hasAdvancedAppsFeature: advancedAppsFeatureResolver,
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
        useNewWidgetRendererInConfigLocation: [
          'spaceContext',
          (spaceContext: any) =>
            getVariation(FLAGS.NEW_WIDGET_RENDERER_APP_CONFIG, {
              spaceId: spaceContext.getId(),
              organizationId: spaceContext.organization.sys.id,
              environmentId: spaceContext.getEnvironmentId(),
            }),
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
            const params: { spaceId: string; appId?: string; environmentId?: string } = {
              spaceId: spaceContext.getId(),
            };

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
        '$scope',
        'app',
        'canManageThisApp',
        'useNewWidgetRendererInConfigLocation',
        (
          spaceContext: any,
          $state: any,
          $scope: any,
          app,
          canManageThisApp: boolean,
          useNewWidgetRendererInConfigLocation: boolean
        ) => {
          const appHookBus = makeAppHookBus();

          return {
            goBackToList: () => $state.go('^.list'),
            app,
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
            spaceData: {
              organizationId: spaceContext.organization.sys.id,
              spaceId: spaceContext.getId(),
              environmentId: spaceContext.getEnvironmentId(),
            },
            useNewWidgetRendererInConfigLocation,
            createSdk: memoize((currentAppWidget: Widget) =>
              createAppExtensionSDK({
                spaceContext,
                $scope,
                widgetNamespace: WidgetNamespace.APP,
                widgetId: app.appDefinition.sys.id,
                appHookBus,
                currentAppWidget,
              })
            ),
            createBridge: memoize(() =>
              // TODO: ext-2164 - remove this along with feature flag
              createAppExtensionBridge({
                spaceContext,
                appHookBus,
                Navigator,
                SlideInNavigator,
                appDefinition: app.appDefinition,
                currentWidgetId: app.appDefinition.sys.id,
                currentWidgetNamespace: WidgetNamespace.APP,
                getCurrentState,
              })
            ),
          };
        },
      ],
    },
    {
      name: 'page',
      url: '/app_installations/:appId{path:PathSuffix}',
      component: PageWidgetRenderer,
      resolve: {
        app: ['$stateParams', 'spaceContext', ({ appId }) => getAppsRepo().getApp(appId)],
        widget: [
          'app',
          async ({ appDefinition }) => {
            const loader = await getCustomWidgetLoader();

            return loader.getOne({
              widgetNamespace: WidgetNamespace.APP,
              widgetId: appDefinition.sys.id,
            });
          },
        ],
        useNewWidgetRendererInPageLocation: [
          'spaceContext',
          (spaceContext) => {
            return getVariation(FLAGS.NEW_WIDGET_RENDERER_PAGE, {
              spaceId: spaceContext.getId(),
              organizationId: spaceContext.organization.sys.id,
              environmentId: spaceContext.getEnvironmentId(),
            });
          },
        ],
      },
      onEnter: [
        'widget',
        (widget) => {
          const pageLocation =
            widget && widget.locations.find((l) => l.location === WidgetLocation.PAGE);

          if (!pageLocation) {
            throw new Error('This app has not defined a page location!');
          }
        },
      ],
      mapInjectedToProps: [
        '$stateParams',
        'spaceContext',
        'app',
        'widget',
        'useNewWidgetRendererInPageLocation',
        (
          { path = '' },
          spaceContext,
          { appDefinition },
          widget,
          useNewWidgetRendererInPageLocation
        ) => {
          return {
            widget,
            // TODO: remove me once we remove new widget renderer in app location flag
            createPageExtensionBridge: memoize((widget: Widget) =>
              createPageExtensionBridge({
                spaceContext,
                Navigator,
                SlideInNavigator,
                appDefinition,
                currentWidgetId: widget.id,
                currentWidgetNamespace: widget.namespace,
              })
            ),
            useNewWidgetRendererInPageLocation,
            createPageExtensionSDK: memoize((widget, parameters) =>
              createPageWidgetSDK({
                spaceContext,
                widgetNamespace: widget.namespace,
                widgetId: widget.id,
                parameters,
              })
            ),
            path: path.startsWith('/') ? path : `/${path}`,
            environmentId: spaceContext.getEnvironmentId(),
          };
        },
      ],
    },
  ],
};
