import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';
import pluralize from 'pluralize';
import { css } from 'emotion';

import {
  TextLink,
  TableRow,
  TableCell,
  Spinner,
  CardActions,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes';
import ROUTES from 'redux/routes';
import getOrgId from 'redux/selectors/getOrgId';
import getMemberCountsByTeam from 'redux/selectors/teamMemberships/getMemberCountsByTeam';
import { hasReadOnlyPermission } from 'redux/selectors/teams';
import ellipsisStyle from 'ellipsisStyle';

import TeamDialog from './TeamDialog';

const styles = {
  name: css({
    width: '18rem',
    ...ellipsisStyle
  }),
  description: css({
    width: '30rem',
    ...ellipsisStyle
  })
};

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
      <TableRow>
        <TableCell>
          <div className={styles.name}>
            {teamId !== 'placeholder' ? (
              <TextLink
                data-test-id="team-name"
                href={ROUTES.organization.children.teams.children.team.build({
                  orgId,
                  teamId: team.sys.id
                })}>
                {team.name}
              </TextLink>
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
            <CardActions
              iconButtonProps={{ buttonType: 'primary', testId: 'user-space-list.menu.trigger' }}
              data-test-id="user-space-list.menu">
              <DropdownList>
                <DropdownListItem
                  onClick={() => removeTeam(get(team, 'sys.id'))}
                  testId="remove-team-button">
                  Remove
                </DropdownListItem>
                <DropdownListItem
                  onClick={() => this.setState({ showTeamDialog: true })}
                  testId="edit-team-button">
                  Edit
                </DropdownListItem>
              </DropdownList>
            </CardActions>
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
