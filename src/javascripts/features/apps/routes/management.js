import * as React from 'react';
import PropTypes from 'prop-types';
import { AppListingRoute } from '../management/AppListing/AppListingRoute';
import * as TokenStore from 'services/TokenStore';
import { isOwnerOrAdmin, isDeveloper } from 'services/OrganizationRoles';
import { getAppDefinitionLoader } from 'features/apps-core';
import { NewAppRoute } from '../management/NewAppRoute';
import { go } from 'states/Navigator';
import { AppDetailsRoute } from '../management/AppDetails/AppDetailsRoute';

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
      return getAppDefinitionLoader(orgId).getAllForCurrentOrganization();
    }

    return <Component {...props} isLoadingDefinitions={isLoading} definitions={definitions} />;
  }

  WithDefinitions.propTypes = {
    orgId: PropTypes.string.isRequired,
  };

  return WithDefinitions;
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
      component: withDefinitions(
        withCanManageApps(AppDetailsRoute, { redirectIfCannotManageApps: true })
      ),
    },
  ],
};
