import React from 'react';

import {
  Button,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@contentful/ui-component-library';
import Workbench from 'app/common/Workbench.es6';

export default class TeamList extends React.Component {
  render() {
    return (
      <Workbench>
        <Workbench.Header>
          <Workbench.Header.Left>
            <Workbench.Title>Organization users</Workbench.Title>
          </Workbench.Header.Left>
          <Workbench.Header.Actions>
            {`N teams in your organization`}
            <Button icon="PlusCircle">Create team</Button>
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
