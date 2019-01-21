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

import TeamDialog from './TeamDialog.es6';

export default connect(
  (state, { team }) => ({
    orgId: getOrgId(state),
    memberCount: getMemberCountsByTeam(state)[team.sys.id] || 0
  }),
  dispatch => ({
    removeTeam: teamId => dispatch({ type: 'REMOVE_TEAM', payload: { teamId } })
  })
)(
  class TeamListRow extends React.Component {
    static propTypes = {
      team: TeamPropType.isRequired,
      memberCount: PropTypes.number.isRequired,
      orgId: PropTypes.string.isRequired,
      removeTeam: PropTypes.func.isRequired,
      readOnlyPermission: PropTypes.bool.isRequired
    };

    state = {
      showTeamDialog: false
    };

    render() {
      const { team, orgId, removeTeam, readOnlyPermission, memberCount } = this.props;
      const { showTeamDialog } = this.state;

      return (
        <TableRow className="membership-list__item">
          <TableCell>
            {get(team, 'sys.id') !== 'placeholder' ? (
              <a
                href={ROUTES.organization.children.teams.children.team.build({
                  orgId,
                  teamId: team.sys.id
                })}>
                {team.name}
              </a>
            ) : (
              <span>
                {team.name} <Spinner size="small" />
              </span>
            )}
          </TableCell>
          <TableCell>
            <span className="team-details-row_description">{team.description}</span>
          </TableCell>
          <TableCell>{pluralize('member', memberCount, true)}</TableCell>
          {!readOnlyPermission && (
            <TableCell align="right">
              <div className="membership-list__item__menu">
                <Button
                  buttonType="muted"
                  size="small"
                  onClick={() => removeTeam(get(team, 'sys.id'))}
                  extraClassNames="membership-list__item__menu__button">
                  Remove
                </Button>
                <Button
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
            isShown={showTeamDialog}
            onClose={() => this.setState({ showTeamDialog: false })}
            initialTeam={team}
          />
        </TableRow>
      );
    }
  }
);
