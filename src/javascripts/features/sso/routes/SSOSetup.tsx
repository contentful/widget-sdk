import React from 'react';
import StateRedirect from 'app/common/StateRedirect';
import { SSOPage } from '../components/SSOPage';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';
import DocumentTitle from 'components/shared/DocumentTitle';
import { SSOUpsellState } from '../components/SSOUpsellState';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { getOrgFeature, OrganizationFeatures } from 'data/CMA/ProductCatalog';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getOrganization } from 'services/TokenStore';

const FeatureFetcher = createFetcherComponent(async ({ orgId }) => {
  const org = await getOrganization(orgId);
  const featureEnabled = await getOrgFeature(org.sys.id, OrganizationFeatures.SELF_CONFIGURE_SSO);
  const hasPerms = isOwnerOrAdmin(org);
  return {
    showUpsellState: hasPerms && !featureEnabled,
    hasPerms: hasPerms,
    organization: org,
  };
});

export function SSOSetup(props: { orgId: string }) {
  return (
    <>
      <DocumentTitle title="SSO" />
      <FeatureFetcher orgId={props.orgId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading />;
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
