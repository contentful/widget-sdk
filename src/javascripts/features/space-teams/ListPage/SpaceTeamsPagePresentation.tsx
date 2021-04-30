import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Button,
  Tooltip,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';

import { LoadingPlaceholder } from './LoadingPlaceholder';
import { styles } from '../styles';
import { MembershipRow } from './MembershipRow';
import { EmptyStatePlaceholder } from './EmptyStatePlaceholder';
import { useRouteNavigate } from 'core/react-routing';
import { SpaceMembership } from 'core/services/SpaceEnvContext/types';
import { TeamSpaceMembership } from 'contentful-management/types';
import { SpaceRole } from 'app/OrganizationSettings/PropTypes';

type SpaceTeamsPagePresentationProps = {
  isLoading: boolean;
  teamSpaceMemberships: TeamSpaceMembership[];
  spaceMemberships: SpaceMembership[];
  teams: any[];
  availableRoles: typeof SpaceRole[];
  onUpdateTeamSpaceMembership: (membership: SpaceMembership, selectedRoleIds: string[]) => void;
  onRemoveTeamSpaceMembership: (membership: SpaceMembership) => void;
  isPending: boolean;
  readOnly: boolean;
  currentUserAdminSpaceMemberships: SpaceMembership[] | TeamSpaceMembership[];
};

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
  spaceMemberships,
}: SpaceTeamsPagePresentationProps) => {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const navigate = useRouteNavigate();

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
        icon={<ProductIcon icon="Teams" size="large" />}
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
              onClick={() => navigate({ path: 'teams.add' })}>
              Add team
            </Button>
          </Tooltip>
        }
      />
      <Workbench.Content type="default">
        {empty && <EmptyStatePlaceholder />}
        {!empty && (
          <Table testId="membership-table">
            <colgroup>
              <col className={styles.nameCol} />
              <col className={styles.membersCol} />
              <col />
              <col className={styles.actionsCol} />
            </colgroup>
            <TableHead>
              <TableRow>
                <TableCell>Team</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Role</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <LoadingPlaceholder />}
              {!isLoading &&
                teamSpaceMemberships.map((teamSpaceMembership) => {
                  const {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    sys: { id: membershipId },
                  } = teamSpaceMembership;
                  return (
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    <MembershipRow
                      key={membershipId}
                      {...{
                        readOnly,
                        setEditing: (edit) => setEditingRow(edit ? membershipId : null),
                        isEditing: editingRow === membershipId,
                        teamSpaceMembership,
                        teamSpaceMemberships,
                        spaceMemberships,
                        availableRoles,
                        onUpdateTeamSpaceMembership,
                        onRemoveTeamSpaceMembership,
                        isPending,
                        currentUserAdminSpaceMemberships,
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

export { SpaceTeamsPagePresentation };
