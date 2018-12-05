import React from 'react';
import PropTypes from 'prop-types';

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

export default class TeamList extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired
  };

  addTeam = () => {
    ModalLauncher.open(({ onClose, isShown }) => (
      <TeamFormDialog orgId={this.props.orgId} isShown={isShown} onClose={onClose} />
    ));
  };

  render() {
    return (
      <Workbench>
        <Workbench.Header>
          <Workbench.Header.Left>
            <Workbench.Title>Organization users</Workbench.Title>
          </Workbench.Header.Left>
          <Workbench.Header.Actions>
            {`N teams in your organization`}
            <Button icon="PlusCircle" onClick={this.addTeam}>
              Create team
            </Button>
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content>
          <section style={{ padding: '1em 2em 2em' }}>
            <Table data-test-id="organization-teams-page">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Hejo</TableCell>
                  <TableCell>The most awesome team in Contentful</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>
        </Workbench.Content>
      </Workbench>
    );
  }
}
