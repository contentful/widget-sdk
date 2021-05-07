import React from 'react';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getOrgFeature, OrganizationFeatures } from 'data/CMA/ProductCatalog';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';
import StateRedirect from 'app/common/StateRedirect';
import { getOrganization } from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { TeamList } from '../components/TeamList';
import { TeamsEmptyState } from '../components/TeamsEmptyState';

const TeamListFetcher = createFetcherComponent(async ({ orgId }) => {
  const [organization, hasTeamsEnabled] = await Promise.all([
    getOrganization(orgId),
    getOrgFeature(orgId, OrganizationFeatures.TEAMS, true),
  ]);

  const readOnlyPermission = !isOwnerOrAdmin(organization);
  return { readOnlyPermission, hasTeamsEnabled };
});

export function TeamListRoute({ orgId }: { orgId: string }) {
  return (
    <>
      <DocumentTitle title="Team Details" />
      <TeamListFetcher orgId={orgId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading />;
          }
          if (isError) {
            return <StateRedirect path="settings" />;
          }

          if (!data.hasTeamsEnabled) {
            return (
              <TeamsEmptyState isLegacy={true} isAdmin={!data.readOnlyPermission} orgId={orgId} />
            );
          }

          return <TeamList readOnlyPermission={data.readOnlyPermission} orgId={orgId} />;
        }}
      </TeamListFetcher>
    </>
  );
}
