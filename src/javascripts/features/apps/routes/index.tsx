/* eslint-disable rulesdir/allow-only-import-export-in-index, import/no-default-export */
import * as React from 'react';
import { noop } from 'lodash';
import { MarketplacePage } from '../MarketplacePage';
import { AppRoute } from '../AppPage';
import {
  CustomRouter,
  RouteErrorBoundary,
  Route,
  Routes,
  useNavigationState,
  useParams,
} from 'core/react-routing';
import { makeAppHookBus, getAppsRepo } from 'features/apps-core';
import {
  getSpaceFeature,
  getOrgFeature,
  SpaceFeatures,
  OrganizationFeatures,
} from 'data/CMA/ProductCatalog';
import { shouldHide, Action } from 'access_control/AccessChecker';
import StateRedirect from 'app/common/StateRedirect';
import { PageWidgetRenderer } from 'features/page-widgets';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

const DEFAULT_FEATURE_STATUS = true; // Fail open

export const DEFAULT_ADVANCED_APPS_STATUS = false;

export function canUserManageApps() {
  return !shouldHide(Action.UPDATE, 'settings');
}

function withAppsResolver(Component) {
  function WithAppsResolver(props) {
    const { currentSpaceId, currentOrganizationId } = useSpaceEnvContext();
    const [appsFeature, setAppsFeature] = React.useState(DEFAULT_FEATURE_STATUS);
    const [advancedAppsFeature, setAdvancedAppsFeature] = React.useState(
      DEFAULT_ADVANCED_APPS_STATUS
    );
    const { current: repo } = React.useRef(getAppsRepo());

    React.useEffect(() => {
      getSpaceFeature(currentSpaceId, SpaceFeatures.BASIC_APPS, DEFAULT_FEATURE_STATUS)
        .then(setAppsFeature)
        .catch(noop);
    }, [currentSpaceId]);

    React.useEffect(() => {
      getOrgFeature(
        currentOrganizationId,
        OrganizationFeatures.ADVANCED_APPS,
        DEFAULT_ADVANCED_APPS_STATUS
      )
        .then(setAdvancedAppsFeature)
        .catch(noop);
    }, [currentOrganizationId]);

    return (
      <Component
        {...props}
        canManageApps={canUserManageApps()}
        hasAppsFeature={appsFeature}
        hasAdvancedAppsFeature={advancedAppsFeature}
        repo={repo}
      />
    );
  }

  return WithAppsResolver;
}

const ProvidedListRoute = withAppsResolver(MarketplacePage);
const ProvidedPageWidgetRenderer = withAppsResolver((props) => {
  const params = useParams() as { appId: string; '*': string };

  const appId = params.appId;

  let path = params['*'] || '';
  if (path && !path.startsWith('/')) {
    path = `/${path}`;
  }

  return <PageWidgetRenderer {...props} appId={appId} path={path} />;
});

const ProvidedAppRoute = withAppsResolver((props) => {
  const { appId } = useParams() as { appId: string };
  const navigationState = useNavigationState<{ acceptedPermissions: boolean }>();
  const { current: appHookBus } = React.useRef(makeAppHookBus());
  return (
    <AppRoute
      {...props}
      appHookBus={appHookBus}
      appId={appId}
      acceptedPermissions={navigationState?.acceptedPermissions}
    />
  );
});

function AppsRouter() {
  const [basename] = window.location.pathname.split('apps');

  return (
    <CustomRouter splitter="apps">
      <RouteErrorBoundary>
        <Routes basename={basename + 'apps'}>
          <Route name="spaces.detail.apps.list" path="/" element={<ProvidedListRoute />} />
          <Route name="spaces.detail.apps.detail" path="/:appId" element={<ProvidedAppRoute />} />
          <Route
            name="spaces.detail.apps.page"
            path="/app_installations/:appId/*"
            element={<ProvidedPageWidgetRenderer />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
}

export const appRoute = {
  name: 'apps',
  url: '/apps{pathname:any}',
  params: {
    navigationState: null,
  },
  component: AppsRouter,
};
