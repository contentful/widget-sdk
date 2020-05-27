import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableHead,
  TableCell,
  TableBody,
  TableRow,
} from '@contentful/forma-36-react-components';
import { TeamSpaceMembership as TeamSpaceMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { TeamSpaceMembershipRow } from './TeamSpaceMembershipRow';
import { TeamSpaceMembershipForm } from './TeamSpaceMembershipForm';

export const TeamSpaceMembershipList = ({
  orgId,
  onEdit,
  items,
  readOnlyPermission,
  removeTeamSpaceMembership,
}) => {
  const [editingMembershipId, setEditingMembershipId] = useState(null);
  return (
    <>
      <Table testId="team-space-memberships-table">
        <TableHead>
          <TableRow>
            <TableCell>Space</TableCell>
            <TableCell>Space roles</TableCell>
            <TableCell>Created at</TableCell>
            {!readOnlyPermission && (
              <>
                <TableCell>Created by</TableCell>
                <TableCell />
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((membership) =>
            editingMembershipId === membership.sys.id ? (
              <TeamSpaceMembershipForm
                key={membership.sys.id}
                initialMembership={membership}
                orgId={orgId}
                onClose={() => {
                  setEditingMembershipId(null);
                  onEdit();
                }}
              />
            ) : (
              <TeamSpaceMembershipRow
                key={membership.sys.id}
                membership={membership}
                onEdit={() => setEditingMembershipId(membership.sys.id)}
                removeTeamSpaceMembership={removeTeamSpaceMembership}
                readOnlyPermission={readOnlyPermission}
              />
            )
          )}
        </TableBody>
      </Table>
    </>
  );
};

TeamSpaceMembershipList.propTypes = {
  items: PropTypes.arrayOf(TeamSpaceMembershipPropType),
  removeTeamSpaceMembership: PropTypes.func.isRequired,
  readOnlyPermission: PropTypes.bool,
  orgId: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
};
