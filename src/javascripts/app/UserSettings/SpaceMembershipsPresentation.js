import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextLink,
  Workbench
} from '@contentful/forma-36-react-components';
import moment from 'moment';

import { Space as SpacePropType } from 'app/OrganizationSettings/PropTypes';
import Icon from 'ui/Components/Icon';

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
              <TableRow key={space.sys.id} testId="membership-row">
                <TableCell testId="space-cell">
                  <TextLink href={`/spaces/${space.sys.id}`}>{space.name}</TextLink>
                </TableCell>
                <TableCell testId="organization-cell">{space.organization.name}</TableCell>
                <TableCell title={moment(space.sys.createdAt).format('MMMM DD, YYYY')}>
                  {moment(space.sys.createdAt, moment.ISO_8601).fromNow()}
                </TableCell>
                <TableCell testId="actions-cell">
                  {space.spaceMembership && (
                    <Button
                      testId="action--leave-space"
                      onClick={() => onLeave(space)}
                      buttonType="muted"
                      size="small">
                      Leave
                    </Button>
                  )}
                  {!space.spaceMembership && (
                    <em data-test-id="no-actions-placeholder--via-team">Member via team</em>
                  )}
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
