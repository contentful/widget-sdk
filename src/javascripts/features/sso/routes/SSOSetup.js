import React from 'react';
import StateRedirect from 'app/common/StateRedirect';
import { SSOPage } from '../components/SSOPage';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';
import DocumentTitle from 'components/shared/DocumentTitle';
import { SSOUpsellState } from '../components/SSOUpsellState';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getCurrentOrg } from 'core/utils/getCurrentOrg';

const FeatureFetcher = createFetcherComponent(async () => {
  const org = await getCurrentOrg();
  const featureEnabled = await getOrgFeature(org.sys.id, 'self_configure_sso');
  const hasPerms = isOwnerOrAdmin(org);
  return {
    showUpsellState: hasPerms && !featureEnabled,
    hasPerms: hasPerms,
    organization: org,
  };
});

export function SSOSetup() {
  return (
    <>
      <DocumentTitle title="SSO" />
      <FeatureFetcher>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading message="Loading..." />;
          }
          if (isError) {
            return <StateRedirect path="home" />;
          }

          if (!data.hasPerms) {
            return <ForbiddenPage />;
          }

          if (data.showUpsellState) {
            return <SSOUpsellState />;
          }

          return <SSOPage organization={data.organization} />;
        }}
      </FeatureFetcher>
    </>
  );
}
