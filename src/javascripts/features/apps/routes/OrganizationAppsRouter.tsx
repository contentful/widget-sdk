import React, { useState, useEffect, useCallback } from 'react';
import { AppListingRoute } from '../management/AppListing/AppListingRoute';
import * as TokenStore from 'services/TokenStore';
import { isOwnerOrAdmin, isDeveloper } from 'services/OrganizationRoles';
import { NewAppRoute } from '../management/NewAppRoute';
import { AppDetailsRoute } from '../management/AppDetails/AppDetailsRoute';
import { useAsync } from 'core/hooks';
import { ManagementApiClient } from '../management/ManagementApiClient';
import { Routes, Route, router, useParams } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';

type OrganizationAppsRouteCommonProps = {
  orgId: string;
};

function withDefinitions(Component) {
  function WithDefinitions(props: OrganizationAppsRouteCommonProps) {
    const [definitions, setDefinitions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      async function load() {
        setIsLoading(true);

        const definitionsData = await getDefinitionsData(props.orgId);

        setDefinitions(definitionsData);

        setIsLoading(false);
      }

      load();
    }, [props.orgId]);

    async function getDefinitionsData(orgId) {
      return ManagementApiClient.getAppDefinitionsForOrganization(orgId);
    }

    return <Component {...props} isLoadingDefinitions={isLoading} definitions={definitions} />;
  }

  return WithDefinitions;
}

function withBundles(Component) {
  function WithBundles(props: OrganizationAppsRouteCommonProps) {
    const { definitionId } = useParams();
    const { isLoading, data: bundles } = useAsync(
      useCallback(
        () => ManagementApiClient.getAppBundles(props.orgId, definitionId),
        [props.orgId, definitionId]
      )
    );

    return <Component {...props} isLoadingBundles={isLoading} bundles={bundles} />;
  }

  return WithBundles;
}

function withCanManageApps(Component, options = { redirectIfCannotManageApps: false }) {
  const { redirectIfCannotManageApps } = options;
  function WithCanManageApps(props: OrganizationAppsRouteCommonProps) {
    const [canManageApps, setCanManageApps] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      async function load() {
        setIsLoading(true);

        const organization = await TokenStore.getOrganization(props.orgId);
        const canManageApps = [isOwnerOrAdmin(organization), isDeveloper(organization)].some(
          Boolean
        );

        if (redirectIfCannotManageApps && !canManageApps) {
          return router.navigate({ path: 'organizations.apps.list', orgId: props.orgId });
        }

        setCanManageApps(canManageApps);
        setIsLoading(false);
      }

      load();
    }, [props.orgId]);

    return (
      <Component {...props} isLoadingCanManageApps={isLoading} canManageApps={canManageApps} />
    );
  }

  return WithCanManageApps;
}

const AppsListRoute = withDefinitions(
  withCanManageApps(AppListingRoute, { redirectIfCannotManageApps: false })
);

const AppsNewDefinitionRoute = withCanManageApps(NewAppRoute, { redirectIfCannotManageApps: true });

const AppDefinitionRoute = withBundles(
  withDefinitions(withCanManageApps(AppDetailsRoute, { redirectIfCannotManageApps: true }))
);

export function OrganizationAppsRouter({ orgId }: { orgId: string }) {
  return (
    <Routes>
      <Route
        name="account.organizations.apps.list"
        path="/"
        element={<AppsListRoute orgId={orgId} />}
      />
      <Route
        name="account.organizations.apps.new_definition"
        path="/new_definition"
        element={<AppsNewDefinitionRoute orgId={orgId} />}
      />
      <Route
        name="account.organizations.apps.definition"
        path="/definitions/:definitionId"
        element={<AppDefinitionRoute orgId={orgId} />}
      />
      <Route
        name="account.organizations.apps.definition"
        path="/definitions/:definitionId/:tab"
        element={<AppDefinitionRoute orgId={orgId} />}
      />
      <Route name={null} path="*" element={<StateRedirect path="home" />} />
    </Routes>
  );
}
