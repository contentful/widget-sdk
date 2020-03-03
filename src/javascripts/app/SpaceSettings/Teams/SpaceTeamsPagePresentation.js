import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Button,
  Tooltip,
  Workbench
} from '@contentful/forma-36-react-components';
import NavigationIcon from 'ui/Components/NavigationIcon';

import {
  SpaceMembership as SpaceMembershipPropType,
  SpaceRole as SpaceRolePropType,
  TeamSpaceMembership as TeamSpaceMembershipPropType
} from 'app/OrganizationSettings/PropTypes';
import { go } from 'states/Navigator';

import LoadingPlaceholder from './List/LoadingPlaceholder';
import styles from './styles';
import MembershipRow from './List/MembershipRow';
import EmptyStatePlaceholder from './EmptyStatePlaceholder';

const goToAddTeams = () =>
  go({
    path: ['spaces', 'detail', 'settings', 'teams', 'add']
  });

const SpaceTeamsPagePresentation = ({
  teamSpaceMemberships,
  teams,
  isLoading,
  isPending,
  availableRoles,
  onUpdateTeamSpaceMembership,
  onRemoveTeamSpaceMembership,
  readOnly,
  currentUserAdminSpaceMemberships,
  spaceMemberships
}) => {
  const [editingRow, setEditingRow] = useState(null);

  // close editing mode after pending no more
  useEffect(() => {
    !isPending && setEditingRow(null);
  }, [isPending]);

  const noTeamsInOrg = teams.length === 0;
  const allTeamsAdded = teamSpaceMemberships.length === teams.length;
  const empty = !isLoading && teamSpaceMemberships.length === 0;

  return (
    <Workbench>
      <Workbench.Header
        icon={<NavigationIcon icon="teams" color="green" size="large" />}
        title={`Teams ${!isLoading ? `(${teamSpaceMemberships.length})` : ''}`}
        actions={
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
        }
      />
      <Workbench.Content className={styles.content} type="default">
        {empty && <EmptyStatePlaceholder />}
        {!empty && (
          <Table testId="membership-table" className={styles.table}>
            <TableHead>
              <TableRow>
                <TableCell className={styles.teamColumn}>Team</TableCell>
                <TableCell className={styles.membersColumn}>Members</TableCell>
                <TableCell className={styles.rolesColumn}>Role</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <LoadingPlaceholder />}
              {!isLoading &&
                teamSpaceMemberships.map(teamSpaceMembership => {
                  const {
                    sys: { id: membershipId }
                  } = teamSpaceMembership;
                  return (
                    <MembershipRow
                      key={membershipId}
                      {...{
                        readOnly,
                        setEditing: edit => setEditingRow(edit ? membershipId : null),
                        isEditing: editingRow === membershipId,
                        teamSpaceMembership,
                        teamSpaceMemberships,
                        spaceMemberships,
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
        )}
      </Workbench.Content>
    </Workbench>
  );
};

SpaceTeamsPagePresentation.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  teamSpaceMemberships: PropTypes.arrayOf(TeamSpaceMembershipPropType),
  spaceMemberships: PropTypes.arrayOf(SpaceMembershipPropType),
  teams: PropTypes.array.isRequired,
  availableRoles: PropTypes.arrayOf(SpaceRolePropType),
  onUpdateTeamSpaceMembership: PropTypes.func.isRequired,
  onRemoveTeamSpaceMembership: PropTypes.func.isRequired,
  isPending: PropTypes.bool.isRequired,
  readOnly: PropTypes.bool.isRequired,
  currentUserAdminSpaceMemberships: PropTypes.arrayOf(
    PropTypes.oneOfType([SpaceMembershipPropType, TeamSpaceMembershipPropType])
  ).isRequired
};

export default SpaceTeamsPagePresentation;
