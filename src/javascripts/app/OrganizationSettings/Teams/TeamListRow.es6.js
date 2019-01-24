import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';
import pluralize from 'pluralize';

import { Button, TableRow, TableCell, Spinner } from '@contentful/forma-36-react-components';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import ROUTES from 'redux/routes.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import { getMemberCountsByTeam } from 'redux/selectors/teamMemberships.es6';
import { hasReadOnlyPermission } from 'redux/selectors/teams.es6';

import TeamDialog from './TeamDialog.es6';

class TeamListRow extends React.Component {
  static propTypes = {
    team: TeamPropType.isRequired,

    readOnlyPermission: PropTypes.bool.isRequired,
    memberCount: PropTypes.number.isRequired,
    orgId: PropTypes.string.isRequired,
    removeTeam: PropTypes.func.isRequired
  };

  state = {
    showTeamDialog: false
  };

  render() {
    const { team, orgId, removeTeam, readOnlyPermission, memberCount } = this.props;
    const { showTeamDialog } = this.state;
    const teamId = get(team, 'sys.id');

    return (
      <TableRow className="membership-list__item">
        <TableCell>
          {teamId !== 'placeholder' ? (
            <a
              data-test-id="team-name"
              href={ROUTES.organization.children.teams.children.team.build({
                orgId,
                teamId: team.sys.id
              })}>
              {team.name}
            </a>
          ) : (
            <span data-test-id="team-name">
              {team.name} <Spinner size="small" />
            </span>
          )}
        </TableCell>
        <TableCell>
          <span data-test-id="team-description" className="team-details-row_description">
            {team.description}
          </span>
        </TableCell>
        <TableCell data-test-id="team-member-count">
          {pluralize('member', memberCount, true)}
        </TableCell>
        {!readOnlyPermission && (
          <TableCell align="right">
            <div className="membership-list__item__menu">
              <Button
                testId="remove-team-button"
                buttonType="muted"
                size="small"
                onClick={() => removeTeam(get(team, 'sys.id'))}
                extraClassNames="membership-list__item__menu__button">
                Remove
              </Button>
              <Button
                testId="edit-team-button"
                buttonType="muted"
                size="small"
                onClick={() => this.setState({ showTeamDialog: true })}
                extraClassNames="membership-list__item__menu__button">
                Edit
              </Button>
            </div>
          </TableCell>
        )}
        <TeamDialog
          testId="team-edit-dialog"
          isShown={showTeamDialog}
          onClose={() => this.setState({ showTeamDialog: false })}
          initialTeam={team}
        />
      </TableRow>
    );
  }
}

export default connect(
  (state, { team }) => ({
    orgId: getOrgId(state),
    memberCount: getMemberCountsByTeam(state)[team.sys.id] || 0,
    readOnlyPermission: hasReadOnlyPermission(state)
  }),
  dispatch => ({
    removeTeam: teamId => dispatch({ type: 'REMOVE_TEAM', payload: { teamId } })
  })
)(TeamListRow);
