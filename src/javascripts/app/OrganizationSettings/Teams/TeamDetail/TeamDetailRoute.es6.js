import React from 'react';
import PropTypes from 'prop-types';

import TeamDetail from './TeamDetail.es6';
import OrgAdminOnly from 'app/common/OrgAdminOnly.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import createTeamService from '../TeamService.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getAllMembershipsWithQuery } from 'access_control/OrganizationMembershipRepository.es6';
import resolveLinks from 'app/OrganizationSettings/LinkResolver.es6';

const TeamDetailFetcher = createFetcherComponent(async ({ orgId, teamId }) => {
  const endpoint = createOrganizationEndpoint(orgId);
  const service = createTeamService(orgId);
  const userLinkPath = 'sys.user';
  const [team, teamMemberships, orgMemberships] = await Promise.all([
    service.get(teamId),
    service.getTeamMemberships(teamId, { include: [userLinkPath, 'sys.createdBy'].join() }),
    // get ALL organization memberships. used when adding new team members
    getAllMembershipsWithQuery(endpoint, { include: [userLinkPath] })
  ]);

  const resolvedTeamMemberships = resolveLinks({
    paths: [userLinkPath, 'sys.createdBy'],
    includes: teamMemberships.includes,
    items: teamMemberships.items
  });

  const resolvedOrgMemberships = resolveLinks({
    paths: [userLinkPath],
    includes: orgMemberships.includes,
    items: orgMemberships.items
  });
  const createdByMembership = resolvedOrgMemberships.find(
    membership => membership.sys.user.sys.id === team.sys.createdBy.sys.id
  );

  if (createdByMembership) {
    // we can't use includes in  a single resource request.
    // manually replace the link with the actual user, if found
    team.sys.createdBy = createdByMembership.sys.user;
  }

  return [team, resolvedTeamMemberships, resolvedOrgMemberships];
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

            const [team, teamMemberships, orgMemberships] = data;
            const nonPendingOrgMemberships = orgMemberships.filter(
              ({
                sys: {
                  user: { firstName }
                }
              }) => firstName !== null
            );
            return (
              <TeamDetail
                orgId={orgId}
                team={team}
                teamMemberships={teamMemberships}
                orgMemberships={nonPendingOrgMemberships}
              />
            );
          }}
        </TeamDetailFetcher>
      </OrgAdminOnly>
    );
  }
}
