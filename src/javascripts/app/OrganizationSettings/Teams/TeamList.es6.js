import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { connect } from 'react-redux';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import {
  Button,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Tooltip
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

import { getTeamListWithOptimistic, hasReadOnlyPermission } from 'redux/selectors/teams.es6';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import Icon from 'ui/Components/Icon.es6';

import TeamDialog from './TeamDialog.es6';
import TeamListRow from './TeamListRow.es6';
import TeamsEmptyState from './TeamsEmptyState.es6';
import ExperimentalFeatureNote from './ExperimentalFeatureNote.es6';

const styles = {
  section: css({
    padding: `${tokens.spacingM} ${tokens.spacingXl} ${tokens.spacingXl}`
  }),
  headerActions: css({
    display: 'flex',
    alignItems: 'center'
  }),
  teamCount: css({
    marginRight: tokens.spacingS
  }),
  table: css({
    tableLayout: 'fixed'
  }),
  nameColumn: css({
    width: '30%'
  }),
  descriptionColumn: css({
    width: '55%'
  }),
  membersColumn: css({
    width: '15%'
  }),
  actionsColumn: css({
    width: '21%'
  })
};

class TeamList extends React.Component {
  static propTypes = {
    teams: PropTypes.arrayOf(TeamPropType).isRequired,
    submitNewTeam: PropTypes.func.isRequired,
    readOnlyPermission: PropTypes.bool.isRequired
  };

  state = {
    showTeamDialog: false
  };

  render() {
    const { teams, readOnlyPermission } = this.props;
    const { showTeamDialog } = this.state;

    const teamsPlural = pluralize('teams', teams.length, true);
    const countMessage = readOnlyPermission
      ? `You are in ${teamsPlural}`
      : `${teamsPlural} in your organization`;

    if (teams.length === 0) return <TeamsEmptyState isAdmin={!readOnlyPermission} />;

    return (
      <Workbench>
        <Workbench.Header
          icon={<Icon name="page-teams" scale={0.75} />}
          title="Teams"
          actions={
            <div className={styles.headerActions}>
              <span data-test-id="team-count" className={styles.teamCount}>
                {countMessage}
              </span>
              {readOnlyPermission ? (
                <Tooltip
                  testId="read-only-tooltip"
                  place="left"
                  content="You don't have permission to create new teams">
                  <Button disabled testId="new-team-button">
                    New team
                  </Button>
                </Tooltip>
              ) : (
                <Button
                  testId="new-team-button"
                  onClick={() => this.setState({ showTeamDialog: true })}>
                  New team
                </Button>
              )}
            </div>
          }
        />
        <Workbench.Content type="default">
          <ExperimentalFeatureNote />
          <section className={styles.section}>
            {teams.length > 0 && (
              <Table testId="teams-table" className={styles.table}>
                <TableHead>
                  <TableRow testId="team-details-row">
                    <TableCell width="300" testId="team-name" className={styles.nameColumn}>
                      Name
                    </TableCell>
                    <TableCell testId="team-description" className={styles.descriptionColumn}>
                      Description
                    </TableCell>
                    <TableCell className={styles.membersColumn}>Members</TableCell>
                    {!readOnlyPermission && <TableCell className={styles.actionsColumn} />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teams.map((team, index) => {
                    const teamId = team.sys.id;
                    return (
                      <TeamListRow team={team} key={teamId === 'placeholder' ? index : teamId} />
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </section>
          <TeamDialog
            testId="create-team-dialog"
            onClose={() => this.setState({ showTeamDialog: false })}
            isShown={showTeamDialog}
          />
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default connect(
  state => ({
    teams: getTeamListWithOptimistic(state),
    readOnlyPermission: hasReadOnlyPermission(state)
  }),
  dispatch => ({
    submitNewTeam: team => dispatch({ type: 'CREATE_NEW_TEAM', payload: { team } })
  })
)(TeamList);
