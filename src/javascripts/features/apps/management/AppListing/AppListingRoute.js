import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { Workbench, Heading } from '@contentful/forma-36-react-components';
import { getOrgFeature, OrganizationFeatures } from 'data/CMA/ProductCatalog';
import { DEFAULT_ADVANCED_APPS_STATUS } from 'features/apps/routes';
import { ADVANCED_APPS_LIMIT, BASIC_APPS_LIMIT } from 'features/apps/limits.js';
import { AppListing } from './AppListing';
import DocumentTitle from 'components/shared/DocumentTitle';
import { LoadingState } from 'features/loading-state';

export function AppListingRoute(props) {
  const [definitionLimit, setDefinitionLimit] = useState(0);

  useEffect(() => {
    async function load() {
      const definitionLimit = await getDefinitionLimit(props.orgId);
      setDefinitionLimit(definitionLimit);
    }

    load();
  }, [props.orgId]);

  async function getDefinitionLimit(orgId) {
    let hasAdvancedApps;
    try {
      hasAdvancedApps = await getOrgFeature(
        orgId,
        OrganizationFeatures.ADVANCED_APPS,
        DEFAULT_ADVANCED_APPS_STATUS
      );
    } catch {
      hasAdvancedApps = DEFAULT_ADVANCED_APPS_STATUS;
    }

    return hasAdvancedApps ? ADVANCED_APPS_LIMIT : BASIC_APPS_LIMIT;
  }

  if ((props.isLoadingCanManageApps || props.isLoadingDefinitions) && props.canManageApps) {
    return (
      <Workbench>
        <DocumentTitle title="Apps" />
        <Workbench.Header
          title={<Heading>Apps</Heading>}
          icon={<ProductIcon icon="Apps" size="large" />}
        />
        <LoadingState />
      </Workbench>
    );
  }

  return <AppListing {...props} definitionLimit={definitionLimit} />;
}

AppListingRoute.propTypes = {
  orgId: PropTypes.string.isRequired,
  canManageApps: PropTypes.bool.isRequired,
  definitions: PropTypes.array.isRequired,
  isLoadingCanManageApps: PropTypes.bool.isRequired,
  isLoadingDefinitions: PropTypes.bool.isRequired,
};
