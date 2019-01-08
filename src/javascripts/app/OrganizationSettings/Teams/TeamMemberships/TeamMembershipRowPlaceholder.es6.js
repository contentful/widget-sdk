import React from 'react';
import { TableCell, TableRow, Spinner } from '@contentful/forma-36-react-components';

export default () => (
  <TableRow className="membership-list__item">
    <TableCell>
      <Spinner size="small" />
    </TableCell>
    <TableCell />
    <TableCell />
  </TableRow>
);
