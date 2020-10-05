import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@contentful/forma-36-react-components';
import React from 'react';

export const TableWrapper = ({ children }) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Key ID</TableCell>
          <TableCell>Added at</TableCell>
          <TableCell>Added by</TableCell>
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>{children}</TableBody>
    </Table>
  );
};
