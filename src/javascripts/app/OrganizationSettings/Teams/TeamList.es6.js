import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { connect } from 'react-redux';
import { sortBy } from 'lodash';

import {
  Button,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Modal
} from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { getTeams } from 'redux/selectors/teams.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import ROUTES from 'redux/routes.es6';
import TeamForm from './TeamForm.es6';

export default connect(
  state => ({
    teams: getTeams(state),
    orgId: getOrgId(state)
  }),
  dispatch => ({
    submitNewTeam: team => dispatch({ type: 'SUBMIT_NEW_TEAM', payload: { team } })
  })
)(
  class TeamList extends React.Component {
    static propTypes = {
      teams: PropTypes.objectOf(TeamPropType).isRequired,
      submitNewTeam: PropTypes.func.isRequired,
      onReady: PropTypes.func.isRequired,
      orgId: PropTypes.string.isRequired
    };

    componentDidMount() {
      this.props.onReady();
    }

    addTeam = () =>
      ModalLauncher.open(({ onClose, isShown }) => (
        <Modal isShown={isShown} onClose={onClose}>
          {() => <TeamForm onClose={onClose} onConfirm={this.props.submitNewTeam} />}
        </Modal>
      ));

    render() {
      const { teams, orgId } = this.props;
      const teamList = sortBy(Object.values(teams), 'name');
      return (
        <Workbench>
          <Workbench.Header>
            <Workbench.Header.Left>
              <Workbench.Title>Teams</Workbench.Title>
            </Workbench.Header.Left>
            <Workbench.Header.Actions>
              {`${pluralize('teams', teamList.length, true)} in your organization`}
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
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamList.map(team => (
                    <TableRow key={team.sys.id}>
                      <TableCell>
                        <a
                          href={ROUTES.organization.children.teams.children.team.build({
                            orgId,
                            teamId: team.sys.id
                          })}>
                          {team.name}
                        </a>
                      </TableCell>
                      <TableCell>{team.description}</TableCell>
                      <TableCell>{pluralize('members', team.memberships.length, true)}</TableCell>
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
);
