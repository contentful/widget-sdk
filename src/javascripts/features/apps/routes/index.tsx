/* eslint-disable rulesdir/allow-only-import-export-in-index, import/no-default-export */
import * as React from 'react';
import { noop } from 'lodash';
import { MarketplacePage } from '../MarketplacePage';
import { AppRoute } from '../AppPage';
import { makeAppHookBus, getAppsRepo } from 'features/apps-core';
import {
  getSpaceFeature,
  getOrgFeature,
  SpaceFeatures,
  OrganizationFeatures,
} from 'data/CMA/ProductCatalog';
import { shouldHide, Action } from 'access_control/AccessChecker';
import { PageWidgetRenderer } from '../PageWidgetRenderer';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';

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

function withAppHookBusResolver(Component) {
  function WithAppHookBusResolver(props) {
    const { current: appHookBus } = React.useRef(makeAppHookBus());

    return <Component {...props} appHookBus={appHookBus} />;
  }

  return WithAppHookBusResolver;
}

export const appRoute = {
  name: 'apps',
  url: '/apps',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '?app',
      component: withAppsResolver(MarketplacePage),
    },
    {
      name: 'detail',
      url: '/:appId',
      params: {
        acceptedPermissions: null,
      },
      component: withAppHookBusResolver(withAppsResolver(AppRoute)),
    },
    {
      name: 'page',
      url: '/app_installations/:appId{path:PathSuffix}',
      component: withAppsResolver(PageWidgetRenderer),
    },
  ],
};
