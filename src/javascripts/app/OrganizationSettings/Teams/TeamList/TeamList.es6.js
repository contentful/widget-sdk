import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';

import {
  Button,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import TeamFormDialog from '../TeamFormDialog.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import { href } from 'states/Navigator.es6';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';

export default class TeamList extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    initialTeams: PropTypes.arrayOf(TeamPropType)
  };

  static getLinkToTeam(team) {
    return href({
      path: ['account', 'organizations', 'teams', 'detail'],
      params: { teamId: team.sys.id }
    });
  }

  state = {
    teams: this.props.initialTeams
  };

  addTeam = () => {
    ModalLauncher.open(({ onClose, isShown }) => (
      <TeamFormDialog
        orgId={this.props.orgId}
        isShown={isShown}
        onClose={onClose}
        onTeamCreated={this.handleTeamCreated}
      />
    ));
  };

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
}
