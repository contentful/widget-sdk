import React from 'react';
import PropTypes from 'prop-types';

import {
  Heading,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button
} from '@contentful/forma-36-react-components';

import StateLink from 'app/common/StateLink';

export default function AppListing({ definitions }) {
  if (definitions.length < 1) {
    return (
      <>
        <Heading>No apps found</Heading>
        <StateLink path="^.new_definition">
          {({ onClick }) => <Button onClick={onClick}>Create new</Button>}
        </StateLink>
      </>
    );
  }

  return (
    <>
      <Heading>Apps</Heading>
      <StateLink path="^.new_definition">
        {({ onClick }) => <Button onClick={onClick}>Create new</Button>}
      </StateLink>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>ID</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {definitions.map(def => {
            return (
              <TableRow key={def.sys.id}>
                <TableCell>{def.name}</TableCell>
                <TableCell>{def.sys.id}</TableCell>
                <TableCell>
                  <StateLink path="^.definitions" params={{ definitionId: def.sys.id }}>
                    {({ onClick }) => <Button onClick={onClick}>Edit</Button>}
                  </StateLink>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}

AppListing.propTypes = {
  definitions: PropTypes.arrayOf(PropTypes.object).isRequired
};
