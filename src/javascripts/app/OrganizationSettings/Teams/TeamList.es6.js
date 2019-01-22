import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { connect } from 'react-redux';

import {
  Button,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Tooltip
} from '@contentful/forma-36-react-components';
import Placeholder from 'app/common/Placeholder.es6';
import { getTeamListWithOptimistic, hasReadOnlyPermission } from 'redux/selectors/teams.es6';
import Workbench from 'app/common/Workbench.es6';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import TeamDialog from './TeamDialog.es6';
import TeamListRow from './TeamListRow.es6';
import ExperimentalFeatureNote from './ExperimentalFeatureNote.es6';

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

    return (
      <Workbench>
        <Workbench.Header>
          <Workbench.Header.Left>
            <Workbench.Title>Teams</Workbench.Title>
          </Workbench.Header.Left>
          <Workbench.Header.Actions>
            <span data-test-id="team-count">{`${pluralize(
              'teams',
              teams.length,
              true
            )} in your organization`}</span>
            {readOnlyPermission ? (
              <Tooltip
                testId="read-only-tooltip"
                place="left"
                content="You don't have permission to create or change teams">
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
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content>
          <section style={{ padding: '1em 2em 2em' }}>
            <ExperimentalFeatureNote />
            {teams.length > 0 && (
              <Table data-test-id="teams-table">
                <TableHead>
                  <TableRow data-test-id="team-details-row">
                    <TableCell width="300" data-test-id="team-name">
                      Name
                    </TableCell>
                    <TableCell data-test-id="team-description">Description</TableCell>
                    <TableCell />
                    <TableCell />
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
            {teams.length === 0 && !readOnlyPermission && (
              <Placeholder
                testId="no-teams-placeholder"
                title="Increased user visibility with teams"
                text="Everyone in a team can see other members of that team."
                button={
                  <Button
                    testId="new-team-button"
                    size="small"
                    buttonType="primary"
                    onClick={() => this.setState({ showTeamDialog: true })}>
                    New team
                  </Button>
                }
              />
            )}
            {teams.length === 0 && readOnlyPermission && (
              <Placeholder
                testId="no-teams-placeholder"
                title="Increased user visibility with teams"
                text="There are no teams and you don't have permission to create new teams"
              />
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
