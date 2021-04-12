import * as React from 'react';
import PropTypes from 'prop-types';
import { AppListingRoute } from '../management/AppListing/AppListingRoute';
import * as TokenStore from 'services/TokenStore';
import { isOwnerOrAdmin, isDeveloper } from 'services/OrganizationRoles';
import { NewAppRoute } from '../management/NewAppRoute';
import { go } from 'states/Navigator';
import { AppDetailsRoute } from '../management/AppDetails/AppDetailsRoute';
import { useAsync } from 'core/hooks';
import { ManagementApiClient } from '../management/ManagementApiClient';

function withDefinitions(Component) {
  function WithDefinitions(props) {
    const [definitions, setDefinitions] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
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

  WithDefinitions.propTypes = {
    orgId: PropTypes.string.isRequired,
  };

  return WithDefinitions;
}

function withBundles(Component) {
  function WithBundles(props) {
    const { isLoading, data: bundles } = useAsync(
      React.useCallback(() => ManagementApiClient.getAppBundles(props.orgId, props.definitionId), [
        props.orgId,
        props.definitionId,
      ])
    );

    return <Component {...props} isLoadingBundles={isLoading} bundles={bundles} />;
  }

  WithBundles.propTypes = {
    orgId: PropTypes.string.isRequired,
    definitionId: PropTypes.string.isRequired,
  };

  return WithBundles;
}

function withCanManageApps(Component, options = {}) {
  function WithCanManageApps(props) {
    const [canManageApps, setCanManageApps] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      async function load() {
        setIsLoading(true);

        const organization = await TokenStore.getOrganization(props.orgId);
        const canManageApps = [isOwnerOrAdmin(organization), isDeveloper(organization)].some(
          Boolean
        );

        if (options.redirectIfCannotManageApps && !canManageApps) {
          return go({ path: 'account.organizations.apps.list', params: { orgId: props.orgId } });
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

  WithCanManageApps.propTypes = {
    orgId: PropTypes.string.isRequired,
  };

  return WithCanManageApps;
}

export const managementRoute = {
  name: 'apps',
  url: '/apps',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: withDefinitions(
        withCanManageApps(AppListingRoute, { redirectIfCannotManageApps: false })
      ),
    },
    {
      name: 'new_definition',
      url: '/new_definition',
      component: withCanManageApps(NewAppRoute, { redirectIfCannotManageApps: true }),
    },
    {
      name: 'definitions',
      url: '/definitions/:definitionId/:tab',
      component: withBundles(
        withDefinitions(withCanManageApps(AppDetailsRoute, { redirectIfCannotManageApps: true }))
      ),
    },
  ],
};
