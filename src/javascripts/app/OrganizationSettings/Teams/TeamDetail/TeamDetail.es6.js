import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';

import {
  Team as TeamPropType,
  TeamMembership as TeamMembershipsPropType,
  OrganizationMembership as OrganizationmembershipPropType
} from 'app/OrganizationSettings/PropTypes.es6';

import TeamMemberships from './TeamMemberships/TeamMemberships.es6';
import Workbench from 'app/common/Workbench.es6';

export default class TeamDetail extends React.Component {
  static propTypes = {
    team: TeamPropType.isRequired,
    teamMemberships: PropTypes.arrayOf(TeamMembershipsPropType).isRequired,
    orgMemberships: PropTypes.arrayOf(OrganizationmembershipPropType).isRequired
  };

  render() {
    const { team, teamMemberships, orgMemberships } = this.props;

    return (
      <Workbench className="organization-users-page" testId="organization-team-page">
        <Workbench.Header>
          <Workbench.Header.Left>
            <Workbench.Title>Teams</Workbench.Title>
          </Workbench.Header.Left>
        </Workbench.Header>
        <Workbench.Content>
          <div className="user-details">
            <div className="user-details__sidebar">
              <section className="user-details__profile-section">
                <div className="user-card">
                  <div>
                    <h2 className="user-card__name">{team.name}</h2>
                    {team.description && (
                      <p style={{ margin: '10px 0 0' }} className="user-card__email">
                        {team.description}
                      </p>
                    )}
                  </div>
                </div>
              </section>
              <section className="user-details__profile-section">
                <dl className="definition-list">
                  <dt>Created at</dt>
                  <dd>{moment(team.sys.createdAt).format('MMMM DD, YYYY')}</dd>
                  <dt>Created by</dt>
                  <dd>{getUserName(team.sys.createdBy)}</dd>
                </dl>
              </section>
            </div>
            <div className="user-details__content">
              <TeamMemberships
                team={team}
                initialTeamMemberships={teamMemberships}
                orgMemberships={orgMemberships}
              />
            </div>
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}
