import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import {
  Button,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Tooltip,
  Workbench,
  SkeletonRow,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { orderBy } from 'lodash';
import NavigationIcon from 'ui/Components/NavigationIcon';
import { useAsync } from 'core/hooks';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { getAllTeams } from '../services/TeamRepository';
import { TeamDialog } from './TeamDialog';
import { TeamListRow } from './TeamListRow';
import { TeamsEmptyState } from './TeamsEmptyState';

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

TeamList.propTypes = {
  readOnlyPermission: PropTypes.bool.isRequired,
  orgId: PropTypes.string.isRequired,
};

//fetch Teams data
const fetchTeamsData = (orgId, setData) => async () => {
  const orgEndpoint = createOrganizationEndpoint(orgId);
  const teams = await getAllTeams(orgEndpoint);
  setData(orderBy(teams.items, ['name']));
};

export function TeamList({ readOnlyPermission, orgId }) {
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [teams, setTeams] = useState([]);

  const boundFetch = fetchTeamsData(orgId, setTeams);
  const { isLoading } = useAsync(useCallback(boundFetch, []));

  const onNewTeamCreated = () => {
    setShowTeamDialog(false);
    boundFetch();
  };

  const teamsPlural = pluralize('teams', teams.length, true);
  const countMessage = readOnlyPermission
    ? `You are in ${teamsPlural}`
    : `${teamsPlural} in your organization`;

  if (!isLoading && teams.length === 0) return <TeamsEmptyState isAdmin={!readOnlyPermission} />;

  return (
    <Workbench>
      <Workbench.Header
        icon={<NavigationIcon icon="teams" size="large" color="green" />}
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
              <Button testId="new-team-button" onClick={() => setShowTeamDialog(true)}>
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
              {isLoading && (
                <SkeletonRow
                  testId="team-list.skeleton"
                  columnCount={readOnlyPermission ? 3 : 4}
                  rowCount={5}
                />
              )}
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
        <TeamDialog
          testId="create-team-dialog"
          onClose={onNewTeamCreated}
          isShown={showTeamDialog}
        />
      </Workbench.Content>
    </Workbench>
  );
}
