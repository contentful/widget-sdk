import React from 'react';
import PropTypes from 'prop-types';
import DocumentTitle from 'components/shared/DocumentTitle';
import { TeamDetails } from '../components/TeamDetails';
import { getVariation } from 'LaunchDarkly';
import { NEW_TEAM_DETAILS } from 'featureFlags';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import TeamPage from 'app/OrganizationSettings/Teams/TeamPage';
import StateRedirect from 'app/common/StateRedirect';
import { FetcherLoading } from 'app/common/createFetcherComponent';
import { getOrganization } from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { getTeam } from '../services/TeamRepo';

const TeamDetailsFetcher = createFetcherComponent(async ({ orgId, teamId }) => {
  const endpoint = createOrganizationEndpoint(orgId);
  const [team, organization, newTeamDetailsEnabled] = await Promise.all([
    getTeam(endpoint, teamId),
    getOrganization(orgId),
    getVariation(NEW_TEAM_DETAILS),
  ]);

  const readOnlyPermission = !isOwnerOrAdmin(organization);
  return { team, readOnlyPermission, newTeamDetailsEnabled };
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
            if (data.newTeamDetailsEnabled) {
              return (
                <TeamDetails
                  team={data.team}
                  readOnlyPermission={data.readOnlyPermission}
                  orgId={this.props.orgId}
                />
              );
            }

            return <TeamPage />;
          }}
        </TeamDetailsFetcher>
      </React.Fragment>
    );
  }
}
