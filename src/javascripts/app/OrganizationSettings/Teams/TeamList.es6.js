import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { connect } from 'react-redux';
import { get } from 'lodash';

import {
  Button,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Modal,
  Spinner
} from '@contentful/forma-36-react-components';
import { getTeamListWithOptimistic } from 'redux/selectors/teams.es6';
import Workbench from 'app/common/Workbench.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import ROUTES from 'redux/routes.es6';
import TeamForm from './TeamForm.es6';

export default connect(
  state => ({
    teams: getTeamListWithOptimistic(state),
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
                    <TableCell data-test-id="team-name">Name</TableCell>
                    <TableCell data-test-id="team-description">Description</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teams.map((team, index) => (
                    <TableRow key={get(team, 'sys.id', index)}>
                      <TableCell>
                        {get(team, 'sys.id', false) ? (
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
                      <TableCell>{team.description}</TableCell>
                      <TableCell>
                        {pluralize('members', get(team, 'memberships.length', 0), true)}
                      </TableCell>
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
