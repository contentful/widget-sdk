import React from 'react';
import PropTypes from 'prop-types';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import OrgAdminOnly from 'app/common/OrgAdminOnly';
import StateRedirect from 'app/common/StateRedirect';
import UserProvisioningConfiguration from './UserProvisioningConfiguration';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';
import UserProvisioningUpsellState from './UserProvisioningUpsellState';
import DocumentTitle from 'components/shared/DocumentTitle';

const FeatureFetcher = createFetcherComponent(async ({ orgId }) => {
  const featureEnabled = await getOrgFeature(orgId, 'scim');
  return { featureEnabled };
});

export default function UserProvisioning({ orgId }) {
  return (
    <OrgAdminOnly orgId={orgId}>
      <DocumentTitle title="User provisioning" />
      <FeatureFetcher orgId={orgId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading />;
          }
          if (isError) {
            return <StateRedirect path="home" />;
          }
          if (!data.featureEnabled) {
            return <UserProvisioningUpsellState />;
          }

          return <UserProvisioningConfiguration orgId={orgId} />;
        }}
      </FeatureFetcher>
    </OrgAdminOnly>
  );
}

UserProvisioning.propTypes = {
  orgId: PropTypes.string.isRequired,
};
