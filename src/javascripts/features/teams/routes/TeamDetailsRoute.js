import React from 'react';
import PropTypes from 'prop-types';
import DocumentTitle from 'components/shared/DocumentTitle';
import { TeamDetails } from '../components/TeamDetails';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import StateRedirect from 'app/common/StateRedirect';
import { FetcherLoading } from 'app/common/createFetcherComponent';
import { getOrganization } from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getTeam, getAllTeams } from '../services/TeamRepository';

const TeamDetailsFetcher = createFetcherComponent(async ({ orgId, teamId }) => {
  const endpoint = createOrganizationEndpoint(orgId);
  const [team, allTeams, organization] = await Promise.all([
    getTeam(endpoint, teamId),
    getAllTeams(endpoint),
    getOrganization(orgId),
  ]);

  const readOnlyPermission = !isOwnerOrAdmin(organization);
  return { team, allTeams, readOnlyPermission };
});
export class TeamDetailsRoute extends React.Component {
  static propTypes = {
    teamId: PropTypes.string.isRequired,
    orgId: PropTypes.string.isRequired,
  };

  render() {
    return (
      <React.Fragment>
        <DocumentTitle title="Team Details" />
        <TeamDetailsFetcher orgId={this.props.orgId} teamId={this.props.teamId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading..." />;
            }
            if (isError) {
              return <StateRedirect path="teams" />;
            }
            return (
              <TeamDetails
                team={data.team}
                readOnlyPermission={data.readOnlyPermission}
                orgId={this.props.orgId}
                allTeams={data.allTeams.items}
              />
            );
          }}
        </TeamDetailsFetcher>
      </React.Fragment>
    );
  }
}
