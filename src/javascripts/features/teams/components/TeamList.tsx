import React, { useCallback, useState } from 'react';
import pluralize from 'pluralize';
import {
  Button,
  ModalLauncher,
  SkeletonRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Workbench,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { orderBy } from 'lodash';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { useAsync } from 'core/hooks';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getAllTeams } from '../services/TeamRepository';
import { NewTeamDialog } from './NewTeamDialog';
import { TeamListRow } from './TeamListRow';
import { TeamsEmptyState } from './TeamsEmptyState';
import { Team } from '../types';

const styles = {
  section: css({
    padding: `${tokens.spacingM} ${tokens.spacingXl} ${tokens.spacingXl}`,
  }),
  headerActions: css({
    display: 'flex',
    alignItems: 'center',
  }),
  teamCount: css({
    marginRight: tokens.spacingS,
  }),
  table: css({
    tableLayout: 'fixed',
  }),
  nameColumn: css({
    width: '30%',
  }),
  descriptionColumn: css({
    width: '55%',
  }),
  membersColumn: css({
    width: '15%',
  }),
  actionsColumn: css({
    width: '21%',
  }),
};

//fetch Teams data
const fetchTeamsData = (orgId, setData) => async () => {
  const orgEndpoint = createOrganizationEndpoint(orgId);
  const teams = await getAllTeams(orgEndpoint, undefined);
  setData(orderBy(teams.items, ['name']));
};

export function TeamList({
  readOnlyPermission,
  orgId,
}: {
  readOnlyPermission: boolean;
  orgId: string;
}) {
  const [teams, setTeams] = useState<Team[]>([]);

  const boundFetch = fetchTeamsData(orgId, setTeams);
  const { isLoading } = useAsync(useCallback(boundFetch, []));

  const showNewTeamDialog = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <NewTeamDialog isShown={isShown} onClose={onClose} allTeams={teams} orgId={orgId} />
    ));
  };

  const teamsPlural = pluralize('teams', teams.length, true);
  const countMessage = readOnlyPermission
    ? `You are in ${teamsPlural}`
    : `${teamsPlural} in your organization`;

  if (!isLoading && teams.length === 0)
    return <TeamsEmptyState isAdmin={!readOnlyPermission} orgId={orgId} />;

  return (
    <Workbench>
      <Workbench.Header
        icon={<ProductIcon icon="Teams" size="large" />}
        title="Teams"
        actions={
          <div className={styles.headerActions}>
            <span data-test-id="team-count" className={styles.teamCount}>
              {countMessage}
            </span>
            {readOnlyPermission ? (
              <Tooltip
                testId="read-only-tooltip"
                place="left"
                content="You don't have permission to create new teams">
                <Button disabled testId="new-team-button">
                  New team
                </Button>
              </Tooltip>
            ) : (
              <Button testId="new-team-button" onClick={() => showNewTeamDialog()}>
                New team
              </Button>
            )}
          </div>
        }
      />
      <Workbench.Content type="default">
        <section className={styles.section}>
          <Table testId="teams-table" className={styles.table}>
            <TableHead>
              <TableRow testId="team-details-row">
                <TableCell width="300" testId="team-name" className={styles.nameColumn}>
                  Name
                </TableCell>
                <TableCell testId="team-description" className={styles.descriptionColumn}>
                  Description
                </TableCell>
                <TableCell className={styles.membersColumn}>Members</TableCell>
                {!readOnlyPermission && <TableCell className={styles.actionsColumn} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <SkeletonRow columnCount={readOnlyPermission ? 3 : 4} rowCount={5} />}
              {!isLoading &&
                teams.map((team, index) => {
                  const teamId = team.sys.id;
                  return (
                    <TeamListRow
                      team={team}
                      readOnlyPermission={readOnlyPermission}
                      key={teamId === 'placeholder' ? index : teamId}
                      onClose={boundFetch}
                    />
                  );
                })}
            </TableBody>
          </Table>
        </section>
      </Workbench.Content>
    </Workbench>
  );
}
