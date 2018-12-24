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
  TableCell, Modal
} from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import { href } from 'states/Navigator.es6';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { getAllTeams } from 'redux/selectors/teams.es6';
import TeamForm from '../TeamForm.es6';

export default connect(
  state => ({
    teams: getAllTeams(state)
  }),
  dispatch => ({
    submitNewTeam: team => dispatch({ type: 'SUBMIT_NEW_TEAM', payload: { team } })
  })
)(class TeamList extends React.Component {
  static propTypes = {
    teams: PropTypes.arrayOf(TeamPropType).isRequired,
    submitNewTeam: PropTypes.func.isRequired
  };

  static getLinkToTeam(team) {
    return href({
      path: ['account', 'organizations', 'teams', 'detail'],
      params: { teamId: team.sys.id }
    });
  }

  addTeam = () =>
    ModalLauncher.open(({ onClose, isShown }) => (
      <Modal isShown={isShown} onClose={onClose}>
        <TeamForm
          onClose={onClose}
          onConfirm={this.props.submitNewTeam}
        />
      </Modal>
    ));

  handleTeamCreated = team => {
    this.setState({ teams: [team, ...this.state.teams] });
  };

  render() {
    const { total } = this.props;
    const { teams } = this.state;
    return (
      <Workbench>
        <Workbench.Header>
          <Workbench.Header.Left>
            <Workbench.Title>Teams</Workbench.Title>
          </Workbench.Header.Left>
          <Workbench.Header.Actions>
            {`${pluralize('teams', total, true)} in your organization`}
            <Button onClick={this.addTeam}>New team</Button>
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content>
          <section style={{ padding: '1em 2em 2em' }}>
            <Table data-test-id="organization-teams-page">
              <TableHead>
                <TableRow data-test-id="team-details-row">
                  <TableCell data-test-id="team-name">Name</TableCell>
                  <TableCell data-test-id="team-description">Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teams.map(team => (
                  <TableRow key={team.sys.id}>
                    <TableCell>
                      <a href={TeamList.getLinkToTeam(team)}>{team.name}</a>
                    </TableCell>
                    <TableCell>{team.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </Workbench.Content>
      </Workbench>
    );
  }
});
