import React from 'react';

import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';

export default class TeamDetail extends React.Component {
  render() {
    return (
      <Workbench>
        <Workbench.Header>
          <Workbench.Header.Left>
            <Workbench.Title>Organization users</Workbench.Title>
          </Workbench.Header.Left>
        </Workbench.Header>
        <Workbench.Content>
          <div className="user-details">
            <div className="user-details__sidebar">Hejo Squad</div>
            <div className="user-details__content">
              <h3 style={{ marginBottom: 30 }}>Space memberships</h3>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Member since</TableCell>
                    <TableCell>Added by</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Guilherme Barbosa</TableCell>
                    <TableCell>November 20, 2018</TableCell>
                    <TableCell>Wiktoria Dalach</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}
