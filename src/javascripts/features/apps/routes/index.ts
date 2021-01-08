/* eslint-disable rulesdir/allow-only-import-export-in-index, import/no-default-export */
import { get, memoize } from 'lodash';
import { MarketplacePage } from '../MarketplacePage';
import { AppRoute } from '../AppPage';
import { makeAppHookBus, getAppsRepo } from 'features/apps-core';
import { createAppExtensionSDK } from 'app/widgets/ExtensionSDKs';
import { getSpaceFeature, getOrgFeature } from 'data/CMA/ProductCatalog';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { shouldHide, Action } from 'access_control/AccessChecker';
import * as TokenStore from 'services/TokenStore';
import { isOwnerOrAdmin, isDeveloper } from 'services/OrganizationRoles';
import { Widget, WidgetLocation, WidgetNamespace } from '@contentful/widget-renderer';
import { createPageWidgetSDK } from 'app/widgets/ExtensionSDKs/createPageWidgetSDK';
import { PageWidgetRenderer } from '../PageWidgetRenderer';

const BASIC_APPS_FEATURE_KEY = 'basic_apps';
const DEFAULT_FEATURE_STATUS = true; // Fail open

export const ADVANCED_APPS_FEATURE_KEY = 'advanced_apps';
export const DEFAULT_ADVANCED_APPS_STATUS = false;

function canUserManageApps() {
  return !shouldHide(Action.UPDATE, 'settings');
}

const appsFeatureResolver = [
  'spaceContext',
  async (spaceContext) => {
    try {
      return await getSpaceFeature(
        spaceContext.getId(),
        BASIC_APPS_FEATURE_KEY,
        DEFAULT_FEATURE_STATUS
      );
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
      component: MarketplacePage,
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
            cma: spaceContext.cma,
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
      },
      onEnter: [
        '$state',
        '$stateParams',
        'spaceContext',
        'app',
        'hasAppsFeature',
        ($state, $stateParams, spaceContext, app, hasAppsFeature) => {
          // When executing `onEnter` after a page refresh
          // the current state won't be initialized. For this reason
          // we need to compute params and an absolute path manually.
          const params: { spaceId: string; appId?: string; environmentId?: string } = {
            spaceId: spaceContext.getId(),
          };
          let absoluteListPath = 'spaces.detail.apps.list';
          if (!spaceContext.isMasterEnvironment()) {
            params.environmentId = spaceContext.getEnvironmentId();
            absoluteListPath = 'spaces.detail.environment.apps.list';
          }

          // No need to consent for private apps.
          if (app.isPrivateApp) {
            if (!canUserManageApps()) {
              // redirect users without management permissions to the app list
              return $state.go(absoluteListPath, params);
            }
            // Otherwise allow to continue page rendering.
            return;
          }

          // If an app is not installed and permissions were not accepted
          // we display the app dialog so consent can be given.
          const installingWithoutConsent =
            !app.appInstallation && !$stateParams.acceptedPermissions;

          if (!canUserManageApps() || !hasAppsFeature || installingWithoutConsent) {
            if (hasAppsFeature) {
              // Passing this param will open the app dialog.
              params.appId = app.id;
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
        (spaceContext: any, $state: any, $scope: any, app, canManageThisApp: boolean) => {
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
      },
      onEnter: [
        '$stateParams',
        '$state',
        'app',
        'widget',
        ($stateParams, $state, app, widget) => {
          const pageLocation =
            widget && widget.locations.find((l) => l.location === WidgetLocation.PAGE);

          if (!pageLocation) {
            throw new Error('This app has not defined a page location!');
          }

          // If the url includes the definition, we try to
          // use the human readable slug (which is the app.id)
          // for non private apps
          const hasNicerSlug = !app.isPrivateApp && $stateParams.appId === app.appDefinition.sys.id;

          if (hasNicerSlug) {
            // If it has a nicer slug, that is the app.id
            const slug = app.id;
            // Add environment path portion if we're not on master
            const path = $stateParams.environmentId
              ? 'spaces.detail.environment.apps.page'
              : 'spaces.detail.apps.page';

            return $state.go(path, { ...$stateParams, appId: slug }, { replace: true });
          }
        },
      ],
      mapInjectedToProps: [
        '$stateParams',
        'spaceContext',
        'widget',
        ({ path = '' }, spaceContext, widget) => {
          return {
            widget,
            createPageExtensionSDK: memoize((widget, parameters) =>
              createPageWidgetSDK({
                widgetNamespace: widget.namespace,
                widgetId: widget.id,
                parameters,
                spaceId: spaceContext.getId(),
                contentTypes: spaceContext.publishedCTs.getAllBare(),
                environmentId: spaceContext.getEnvironmentId(),
                aliasesIds: spaceContext.getAliasesIds(),
                space: spaceContext.space,
                pubSubClient: spaceContext.pubsubClient,
                environmentAliasId: spaceContext.getAliasId(),
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
