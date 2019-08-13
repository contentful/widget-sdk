import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextLink
} from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import moment from 'moment';

import { Space as SpacePropType } from 'app/OrganizationSettings/PropTypes.es6';
import Icon from 'ui/Components/Icon.es6';

const SpaceMembershipsPresentation = ({ spaces, onLeave }) => (
  <Workbench>
    <Workbench.Header
      icon={<Icon name="space" scale={0.75} />}
      title={`Space memberships (${(spaces || []).length})`}
    />
    <Workbench.Content type="default">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Organization</TableCell>
            <TableCell>Invited at</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {(spaces || []).map(space => {
            return (
              <TableRow key={space.sys.id}>
                <TableCell>
                  <TextLink href={`/spaces/${space.sys.id}`}>{space.name}</TextLink>
                </TableCell>
                <TableCell>{space.organization.name}</TableCell>
                <TableCell title={moment(space.sys.createdAt).format('MMMM DD, YYYY')}>
                  {moment(space.sys.createdAt, moment.ISO_8601).fromNow()}
                </TableCell>
                <TableCell>
                  {space.spaceMembership && (
                    <Button onClick={() => onLeave(space)} buttonType="muted" size="small">
                      Leave
                    </Button>
                  )}
                  {!space.spaceMembership && <em>Member via team</em>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Workbench.Content>
  </Workbench>
);

SpaceMembershipsPresentation.propTypes = {
  onLeave: PropTypes.func.isRequired,
  spaces: PropTypes.arrayOf(SpacePropType)
};

export default SpaceMembershipsPresentation;
