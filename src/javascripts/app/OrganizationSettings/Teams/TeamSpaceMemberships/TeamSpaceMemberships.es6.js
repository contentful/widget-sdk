import React from 'react';
import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@contentful/forma-36-react-components';

export default class TeamSpaceMemberships extends React.Component {
  render() {
    return (
      <Table
        style={{ marginBottom: 20, tableLayout: 'fixed' }}
        data-test-id="user-memberships-table">
        <TableHead>
          <TableRow>
            <TableCell>Space</TableCell>
            <TableCell>Space roles</TableCell>
            <TableCell>Created by</TableCell>
            <TableCell>Created at</TableCell>
            <TableCell width="200px" />
          </TableRow>
        </TableHead>
        <TableBody />
      </Table>
    );
  }
}
