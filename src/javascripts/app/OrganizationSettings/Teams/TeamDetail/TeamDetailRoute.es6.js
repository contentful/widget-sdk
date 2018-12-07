import React from 'react';
import PropTypes from 'prop-types';

import TeamDetail from './TeamDetail.es6';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import createTeamService from '../TeamService.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getUser } from 'access_control/OrganizationMembershipRepository.es6';

const TeamDetailFetcher = createFetcherComponent(async ({ orgId, teamId }) => {
  const service = createTeamService(orgId);
  const [team, teamMemberships] = await Promise.all([
    service.get(teamId),
    service.getTeamMemberships(teamId, { include: ['sys.createdBy'] })
  ]);
  try {
    const endpoint = createOrganizationEndpoint(orgId);
    const createdByUser = await getUser(endpoint, team.sys.createdBy.sys.id);
    team.sys.createdBy = createdByUser;
  } catch (e) {
    // user got trashed. do nothing
  }

  return [team, teamMemberships];
});

export default class TeamDetailRoute extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    teamId: PropTypes.string.isRequired,
    onReady: PropTypes.func.isRequired,
    context: PropTypes.any
  };

  componentDidMount() {
    this.props.onReady();
  }

  render() {
    const { orgId, teamId } = this.props;
    return (
      <OrgAdminOnly orgId={orgId}>
        <TeamDetailFetcher orgId={orgId} teamId={teamId}>
          {({ isLoading, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading team..." />;
            }

            const [team, teamMemberships] = data;
            return <TeamDetail team={team} teamMemberships={teamMemberships} />;
          }}
        </TeamDetailFetcher>
      </OrgAdminOnly>
    );
  }
}
