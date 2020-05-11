import React from 'react';
import PropTypes from 'prop-types';
import DocumentTitle from 'components/shared/DocumentTitle';
import { TeamDetails } from '../components/TeamDetails';
import { getVariation } from 'LaunchDarkly';
import { NEW_TEAM_DETAILS } from 'featureFlags';
import createFetcherComponent from 'app/common/createFetcherComponent';
import TeamPage from 'app/OrganizationSettings/Teams/TeamPage';
import StateRedirect from 'app/common/StateRedirect';
import { FetcherLoading } from 'app/common/createFetcherComponent';

const FeatureFetcher = createFetcherComponent(async () => {
  const newTeamDetailsEnabled = await getVariation(NEW_TEAM_DETAILS);
  return { newTeamDetailsEnabled };
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
        <FeatureFetcher>
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
                  teamId={this.props.teamId}
                  orgId={this.props.orgId}
                  readOnlyPermission={false}
                />
              );
            }

            return <TeamPage />;
          }}
        </FeatureFetcher>
      </React.Fragment>
    );
  }
}
