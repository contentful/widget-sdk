/* eslint-disable rulesdir/allow-only-import-export-in-index, import/no-default-export */
import * as React from 'react';
import { get, memoize, noop } from 'lodash';
import { MarketplacePage } from '../MarketplacePage';
import { AppRoute } from '../AppPage';
import { makeAppHookBus, getAppsRepo } from 'features/apps-core';
import { createAppExtensionSDK } from 'app/widgets/ExtensionSDKs';
import { getSpaceFeature, getOrgFeature } from 'data/CMA/ProductCatalog';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { shouldHide, Action } from 'access_control/AccessChecker';
import * as TokenStore from 'services/TokenStore';
import { isOwnerOrAdmin, isDeveloper } from 'services/OrganizationRoles';
import { Widget, WidgetNamespace } from '@contentful/widget-renderer';
import { PageWidgetRenderer } from '../PageWidgetRenderer';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

const BASIC_APPS_FEATURE_KEY = 'basic_apps';
const DEFAULT_FEATURE_STATUS = true; // Fail open

export const ADVANCED_APPS_FEATURE_KEY = 'advanced_apps';
export const DEFAULT_ADVANCED_APPS_STATUS = false;

export function canUserManageApps() {
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

function withAppsResolver(Component) {
  function WithAppsResolver(props) {
    const { currentSpaceId, currentOrganizationId } = useSpaceEnvContext();
    const [appsFeature, setAppsFeature] = React.useState(DEFAULT_FEATURE_STATUS);
    const [advancedAppsFeature, setAdvancedAppsFeature] = React.useState(
      DEFAULT_ADVANCED_APPS_STATUS
    );

    React.useEffect(() => {
      getSpaceFeature(currentSpaceId, BASIC_APPS_FEATURE_KEY, DEFAULT_FEATURE_STATUS)
        .then(setAppsFeature)
        .catch(noop);
    }, [currentSpaceId]);

    React.useEffect(() => {
      getOrgFeature(currentOrganizationId, ADVANCED_APPS_FEATURE_KEY, DEFAULT_ADVANCED_APPS_STATUS)
        .then(setAdvancedAppsFeature)
        .catch(noop);
    }, [currentOrganizationId]);

    return (
      <Component
        {...props}
        canManageApps={canUserManageApps()}
        hasAppsFeature={appsFeature}
        hasAdvancedAppsFeature={advancedAppsFeature}
      />
    );
  }

  return WithAppsResolver;
}

export const appRoute = {
  name: 'apps',
  url: '/apps',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '?app',
      component: withAppsResolver((props) => <MarketplacePage {...props} repo={getAppsRepo()} />),
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
        app: ['$stateParams', 'spaceContext', ({ appId }) => getAppsRepo().getAppByIdOrSlug(appId)],
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
          const params: { spaceId: string; app?: string; environmentId?: string } = {
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
              params.app = app.id;
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
      component: withAppsResolver((props) => (
        <PageWidgetRenderer {...props} repo={getAppsRepo()} />
      )),
    },
  ],
};
