import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';
import pluralize from 'pluralize';
import { css } from 'emotion';

import { Button, TableRow, TableCell, Spinner } from '@contentful/forma-36-react-components';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import ROUTES from 'redux/routes.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import getMemberCountsByTeam from 'redux/selectors/teamMemberships/getMemberCountsByTeam.es6';
import { hasReadOnlyPermission } from 'redux/selectors/teams.es6';
import ellipsisStyle from 'ellipsisStyle.es6';

import TeamDialog from './TeamDialog.es6';

const styles = {
  name: css({
    width: '18rem',
    ...ellipsisStyle
  }),
  description: css({
    width: '30rem',
    ...ellipsisStyle
  }),
  row: css({})
};
styles.button = css({
  transition: 'none',
  visibility: 'hidden',
  marginLeft: '10px',
  [`.${styles.row}:hover &`]: { visibility: 'visible' }
});

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
      <TableRow className={styles.row}>
        <TableCell>
          <div className={styles.name}>
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
          </div>
        </TableCell>
        <TableCell>
          <div data-test-id="team-description" className={styles.description}>
            {team.description}
          </div>
        </TableCell>
        <TableCell testId="team-member-count">{pluralize('member', memberCount, true)}</TableCell>
        {!readOnlyPermission && (
          <TableCell align="right">
            <div>
              <Button
                testId="remove-team-button"
                buttonType="muted"
                size="small"
                onClick={() => removeTeam(get(team, 'sys.id'))}
                className={styles.button}>
                Remove
              </Button>
              <Button
                testId="edit-team-button"
                buttonType="muted"
                size="small"
                onClick={() => this.setState({ showTeamDialog: true })}
                className={styles.button}>
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
