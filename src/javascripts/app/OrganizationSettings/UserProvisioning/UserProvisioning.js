import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import OrgAdminOnly from 'app/common/OrgAdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import ForbiddenState from 'app/common/ForbiddenState';
import UserProvisioningConfiguration from './UserProvisioningConfiguration';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';

const FeatureFetcher = createFetcherComponent(async ({ orgId }) => {
  const featureEnabled = await getOrgFeature(orgId, 'scim');
  return { featureEnabled: featureEnabled };
});

export default function UserProvisioning({ orgId, onReady }) {
  useEffect(onReady, [onReady]);

  return (
    <OrgAdminOnly orgId={orgId}>
      <FeatureFetcher orgId={orgId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading message="Loading..." />;
          }
          if (isError) {
            return <StateRedirect path="home" />;
          }
          if (!data.featureEnabled) {
            return <ForbiddenState />;
          }

          return <UserProvisioningConfiguration orgId={orgId} />;
        }}
      </FeatureFetcher>
    </OrgAdminOnly>
  );
}

UserProvisioning.propTypes = {
  orgId: PropTypes.string.isRequired,
  onReady: PropTypes.func.isRequired
};
