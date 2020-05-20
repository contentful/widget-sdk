import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableHead,
  TableCell,
  TableBody,
  TableRow,
} from '@contentful/forma-36-react-components';
import { TeamMembership as TeamMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { TeamMembershipRow } from './TeamMembershipRow';

export const TeamMembershipList = ({ removeFromTeam, items, readOnlyPermission }) => {
  return (
    <>
      <Table testId="team-members-table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Member since</TableCell>
            {!readOnlyPermission && (
              <>
                <TableCell>Added by</TableCell>
                <TableCell />
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((membership) => (
            <TeamMembershipRow
              key={membership.sys.id}
              membership={membership}
              removeFromTeam={removeFromTeam}
              readOnlyPermission={readOnlyPermission}
            />
          ))}
        </TableBody>
      </Table>
    </>
  );
};

TeamMembershipList.propTypes = {
  items: PropTypes.arrayOf(TeamMembershipPropType),
  removeFromTeam: PropTypes.func.isRequired,
  readOnlyPermission: PropTypes.bool,
};
