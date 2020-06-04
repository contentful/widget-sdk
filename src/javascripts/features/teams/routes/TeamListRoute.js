import React from 'react';
import PropTypes from 'prop-types';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getVariation } from 'LaunchDarkly';
import { NEW_TEAM_LIST } from 'featureFlags';
import createFetcherComponent from 'app/common/createFetcherComponent';
import TeamPage from 'app/OrganizationSettings/Teams/TeamPage';
import StateRedirect from 'app/common/StateRedirect';
import { FetcherLoading } from 'app/common/createFetcherComponent';
import { getOrganization } from 'services/TokenStore';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { TeamList } from '../components/TeamList';

const TeamListFetcher = createFetcherComponent(async ({ orgId }) => {
  const [organization, newTeamListEnabled] = await Promise.all([
    getOrganization(orgId),
    getVariation(NEW_TEAM_LIST),
  ]);

  const readOnlyPermission = !isOwnerOrAdmin(organization);
  return { readOnlyPermission, newTeamListEnabled };
});

export class TeamListRoute extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
  };

  render() {
    return (
      <React.Fragment>
        <DocumentTitle title="Team Details" />
        <TeamListFetcher orgId={this.props.orgId}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading..." />;
            }
            if (isError) {
              return <StateRedirect path="settings" />;
            }
            if (data.newTeamListEnabled) {
              return (
                <TeamList readOnlyPermission={data.readOnlyPermission} orgId={this.props.orgId} />
              );
            }

            return <TeamPage />;
          }}
        </TeamListFetcher>
      </React.Fragment>
    );
  }
}
