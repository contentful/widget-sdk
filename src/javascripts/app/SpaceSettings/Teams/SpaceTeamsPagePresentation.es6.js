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
import { css } from 'emotion';

import Workbench from 'app/common/Workbench.es6';
import {
  SpaceMembership as SpaceMembershipProp,
  SpaceRole as SpaceRoleProp,
  TeamSpaceMembership as TeamSpaceMembershipProp
} from 'app/OrganizationSettings/PropTypes.es6';
import { go } from 'states/Navigator.es6';

import LoadingPlaceholder from './List/LoadingPlaceholder.es6';
import styles from './styles.es6';
import MembershipRow from './List/MembershipRow.es6';

const goToAddTeams = () =>
  go({
    path: ['spaces', 'detail', 'settings', 'teams', 'add']
  });

const SpaceTeamsPagePresentation = ({
  memberships,
  teams,
  isLoading,
  isPending,
  availableRoles,
  onUpdateTeamSpaceMembership,
  onRemoveTeamSpaceMembership,
  readOnly,
  currentUserAdminSpaceMemberships
}) => {
  const [openMenu, setOpenMenu] = useState(null);
  const [editingRow, setEditingRow] = useState(null);

  // close editing mode after pending no more
  useEffect(() => {
    !isPending && setEditingRow(null);
  }, [isPending]);

  const noTeamsInOrg = teams.length === 0;
  const allTeamsAdded = memberships.length === teams.length;

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
              !isLoading &&
              ((readOnly && 'You don’t have permission to add teams to this space') ||
                (noTeamsInOrg && 'This organization has no team to add to this space') ||
                (allTeamsAdded && 'All teams in the organization are already in this space'))
            }>
            <Button
              testId="add-teams"
              disabled={noTeamsInOrg || allTeamsAdded || readOnly}
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
                    <TableCell className={css({ width: '19em' })}>Members</TableCell>
                    <TableCell>Role</TableCell>
                  </>
                )}
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
                        onRemoveTeamSpaceMembership,
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
  onRemoveTeamSpaceMembership: PropTypes.func.isRequired,
  isPending: PropTypes.bool.isRequired,
  readOnly: PropTypes.bool.isRequired,
  currentUserAdminSpaceMemberships: PropTypes.arrayOf(
    PropTypes.oneOfType([SpaceMembershipProp, TeamSpaceMembershipProp])
  ).isRequired
};

export default SpaceTeamsPagePresentation;
