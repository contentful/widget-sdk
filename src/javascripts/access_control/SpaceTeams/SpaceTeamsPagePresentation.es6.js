import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Button,
  Tooltip
} from '@contentful/forma-36-react-components';

import Workbench from 'app/common/Workbench.es6';
import {
  SpaceMembership as SpaceMembershipProp,
  SpaceRole as SpaceRoleProp,
  TeamSpaceMembership as TeamSpaceMembershipProp
} from 'app/OrganizationSettings/PropTypes.es6';
import { go } from 'states/Navigator.es6';

import LoadingPlaceholder from './LoadingPlaceholder.es6';
import styles from './styles.es6';
import MembershipRow from './MembershipRow.es6';

const goToAddTeams = () => go({
  path: ['spaces', 'detail', 'settings', 'teams', 'add']
});

const SpaceTeamsPagePresentation = ({
                                      memberships,
                                      teams,
                                      isLoading,
                                      isPending,
                                      availableRoles,
                                      onUpdateTeamSpaceMembership,
                                      readOnly,
  currentUserAdminSpaceMemberships
}) => {
  const [openMenu, setOpenMenu] = useState(null);
  const [editingRow, setEditingRow] = useState(null);

  // close editing mode after pending no more
  useEffect(() => {
    !isPending && setEditingRow(null);
  }, [isPending]);

  const addTeamsButtonDisabled = memberships.length === teams.length;

  return (
    <Workbench>
      <Workbench.Header>
        <Workbench.Header.Left>
          <Workbench.Icon icon="page-teams" />
          <Workbench.Title>Teams {!isLoading && `(${memberships.length})`}</Workbench.Title>
        </Workbench.Header.Left>
        <Workbench.Header.Actions>
          <Tooltip
            place="left"
            content={
              addTeamsButtonDisabled && !isLoading
                ? 'All teams in the organization are already in this space'
                : ''
            }>
            <Button
              testId="add-teams"
              disabled={addTeamsButtonDisabled}
              onClick={goToAddTeams}>
              Add team
            </Button>
          </Tooltip>
        </Workbench.Header.Actions>
      </Workbench.Header>
      <Workbench.Content className={styles.contentAlignment}>
        <div className={styles.content}>
          <Table testId="membership-table">
            <TableHead>
              <TableRow>
                <TableCell>Team</TableCell>
                {!isLoading && (
                  <>
                    <TableCell>Members</TableCell>
                    <TableCell className={styles.rolesColumn}>Role</TableCell>
                  </>
                )}
                <TableCell />
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <LoadingPlaceholder />}
              {!isLoading &&
              memberships.map(membership => {
                const {
                  sys: { id: membershipId }
                } = membership;
                return (
                  <MembershipRow
                    key={membershipId}
                    {...{
                      readOnly,
                      setMenuOpen: open => setOpenMenu(open ? membershipId : null),
                      menuIsOpen: openMenu === membershipId,
                      setEditing: edit => setEditingRow(edit ? membershipId : null),
                      isEditing: editingRow === membershipId,
                      membership,
                      availableRoles,
                      onUpdateTeamSpaceMembership,
                      isPending,
                        currentUserAdminSpaceMemberships
                      }}
                    />
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Workbench.Content>
    </Workbench>
  );
};

SpaceTeamsPagePresentation.propTypes = {
  memberships: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  teams: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  availableRoles: PropTypes.arrayOf(SpaceRoleProp),
  onUpdateTeamSpaceMembership: PropTypes.func.isRequired,
  isPending: PropTypes.bool.isRequired,
  readOnly: PropTypes.bool.isRequired,
  currentUserAdminSpaceMemberships: PropTypes.arrayOf(
    PropTypes.oneOfType([SpaceMembershipProp, TeamSpaceMembershipProp])
  ).isRequired
};

export default SpaceTeamsPagePresentation;
