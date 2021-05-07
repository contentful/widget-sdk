import React from 'react';
import DocumentTitle from 'components/shared/DocumentTitle';
import { TeamDetails } from '../components/TeamDetails';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getOrganization } from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getAllTeams, getTeam } from '../services/TeamRepository';
import { ReactRouterRedirect, useParams } from 'core/react-routing';

const TeamDetailsFetcher = createFetcherComponent(async ({ orgId, teamId }) => {
  const endpoint = createOrganizationEndpoint(orgId);
  const [team, allTeams, organization] = await Promise.all([
    getTeam(endpoint, teamId),
    getAllTeams(endpoint, undefined),
    getOrganization(orgId),
  ]);

  const readOnlyPermission = !isOwnerOrAdmin(organization);
  return { team, allTeams, readOnlyPermission };
});

export function TeamDetailsRoute({ orgId }: { orgId: string }) {
  const { teamId } = useParams();

  return (
    <>
      <DocumentTitle title="Team Details" />
      <TeamDetailsFetcher orgId={orgId} teamId={teamId}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <FetcherLoading />;
          }
          if (isError) {
            return <ReactRouterRedirect route={{ path: 'organizations.teams', orgId }} />;
          }
          return (
            <TeamDetails
              team={data.team}
              readOnlyPermission={data.readOnlyPermission}
              orgId={orgId}
            />
          );
        }}
      </TeamDetailsFetcher>
    </>
  );
}
