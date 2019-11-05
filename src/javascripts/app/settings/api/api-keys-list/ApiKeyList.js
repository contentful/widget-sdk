import React from 'react';
import PropTypes from 'prop-types';
import StateLink from 'app/common/StateLink.es6';
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@contentful/forma-36-react-components';

export default function ApiKeyList({ apiKeys }) {
  return (
    <Table testId="api-key-table">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Description</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {apiKeys.map(key => (
          <TableRow key={key.sys.id}>
            <TableCell>
              <StateLink to="^.detail" params={{ apiKeyId: key.sys.id }} data-test-id="api-link">
                {key.name}
              </StateLink>
            </TableCell>
            <TableCell>{key.description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

ApiKeyList.defaultProps = {
  apiKeys: []
};

ApiKeyList.propTypes = {
  apiKeys: PropTypes.arrayOf(PropTypes.object)
};
