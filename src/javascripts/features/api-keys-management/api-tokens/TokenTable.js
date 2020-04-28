import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import { RevokeButton } from './RevokeButton';

const styles = {
  nameCell: css({
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  }),
  actionCell: css({
    width: '7em',
    textAlign: 'right',
  }),
};

export const TokenTable = ({ tokens, revoke }) => {
  if (tokens.length === 0) {
    return <div data-test-id="pat.emptyTokenTable" />;
  }

  return (
    <Table data-test-id="pat.tokenTable">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell> </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tokens.map((token) => (
          <TableRow key={token.id} testId={`pat.tokenRow.${token.id}`}>
            <TableCell className={styles.nameCell}>{token.name}</TableCell>
            <TableCell className={styles.actionCell}>
              <RevokeButton revoke={revoke} token={token} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

TokenTable.propTypes = {
  tokens: PropTypes.arrayOf(PropTypes.object).isRequired,
  revoke: PropTypes.func.isRequired,
};
