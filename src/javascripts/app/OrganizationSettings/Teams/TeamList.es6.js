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
  Modal
} from '@contentful/forma-36-react-components';
import { getTeamListWithOptimistic } from 'redux/selectors/teams.es6';
import Workbench from 'app/common/Workbench.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import TeamForm from './TeamForm.es6';
import TeamListRow from './TeamListRow.es6';

export default connect(
  state => ({
    teams: getTeamListWithOptimistic(state)
  }),
  dispatch => ({
    submitNewTeam: team => dispatch({ type: 'CREATE_NEW_TEAM', payload: { team } })
  })
)(
  class TeamList extends React.Component {
    static propTypes = {
      teams: PropTypes.arrayOf(TeamPropType).isRequired,
      submitNewTeam: PropTypes.func.isRequired
    };

    addTeam = () =>
      ModalLauncher.open(({ onClose, isShown }) => (
        <Modal isShown={isShown} onClose={onClose}>
          {() => <TeamForm onClose={onClose} onCreateConfirm={this.props.submitNewTeam} />}
        </Modal>
      ));

    render() {
      const { teams } = this.props;

      // TODO: make this route org admin only
      return (
        <Workbench>
          <Workbench.Header>
            <Workbench.Header.Left>
              <Workbench.Title>Teams</Workbench.Title>
            </Workbench.Header.Left>
            <Workbench.Header.Actions>
              {`${pluralize('teams', teams.length, true)} in your organization`}
              <Button onClick={this.addTeam}>New team</Button>
            </Workbench.Header.Actions>
          </Workbench.Header>
          <Workbench.Content>
            <section style={{ padding: '1em 2em 2em' }}>
              <Table data-test-id="organization-teams-page">
                <TableHead>
                  <TableRow data-test-id="team-details-row">
                    <TableCell width="300" data-test-id="team-name">
                      Name
                    </TableCell>
                    <TableCell data-test-id="team-description">Description</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teams.map(team => (
                    <TeamListRow team={team} key={team.sys.id} />
                  ))}
                </TableBody>
              </Table>
            </section>
          </Workbench.Content>
        </Workbench>
      );
    }
  }
);
