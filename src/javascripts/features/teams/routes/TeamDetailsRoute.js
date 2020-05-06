import React from 'react';
import DocumentTitle from 'components/shared/DocumentTitle';
import { TeamDetails } from '../components/TeamDetails';
import { createTeam } from '../services/TeamRepo';
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
  save = async ({ name, description }) => {
    return await createTeam({ name, description });
  };

  render() {
    return (
      <React.Fragment>
        <DocumentTitle title="Team Details" />
        <FeatureFetcher>
          {({ isLoading, isError, data }) => {
            console.log(data);
            if (isLoading) {
              return <FetcherLoading message="Loading..." />;
            }
            if (isError) {
              return <StateRedirect path="teams" />;
            }
            if (data.newTeamDetailsEnabled) {
              return <TeamDetails save={this.save} />;
            }

            return <TeamPage />;
          }}
        </FeatureFetcher>
      </React.Fragment>
    );
  }
}
