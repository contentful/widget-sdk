import React, { useState } from 'react';
import { get } from 'lodash';
import pluralize from 'pluralize';
import { css } from 'emotion';
import {
  CardActions,
  DropdownList,
  DropdownListItem,
  Spinner,
  TableCell,
  TableRow,
  TextLink,
} from '@contentful/forma-36-react-components';
import { TeamDialog } from './TeamDialog';
import { DeleteTeamDialog } from './DeleteTeamDialog';
import { Team } from '../types';
import { Interpolation } from '@emotion/serialize';
import { RouteLink } from 'core/react-routing';

const ellipsisStyle: Interpolation = {
  overflowX: 'hidden',
  textOverflow: 'ellipsis',
  lineHeight: '1.2em',
};

const styles = {
  name: css({
    width: '18rem',
    ...ellipsisStyle,
  }),
  description: css({
    width: '30rem',
    ...ellipsisStyle,
  }),
};

export function TeamListRow({
  team,
  onClose,
  readOnlyPermission,
}: {
  team: Team;
  onClose: VoidFunction;
  readOnlyPermission: boolean;
}) {
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showDeleteTeamDialog, setShowDeleteTeamDialog] = useState(false);
  const teamId = get(team, 'sys.id');

  return (
    <TableRow>
      <TableCell>
        <div className={styles.name}>
          {teamId !== 'placeholder' ? (
            <RouteLink
              route={{
                path: 'organizations.teams.detail',
                orgId: team.sys.organization.sys.id,
                teamId: teamId,
              }}
              as={TextLink}
              key={teamId}
              data-test-id="team-name">
              {team.name}
            </RouteLink>
          ) : (
            <span data-test-id="team-name">
              {team.name} <Spinner size="small" />
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div data-test-id="team-description" className={styles.description}>
          {team.description}
        </div>
      </TableCell>
      <TableCell testId="team-member-count">
        {pluralize('member', team.sys.memberCount, true)}
      </TableCell>
      {!readOnlyPermission && (
        <TableCell align="right">
          <CardActions
            iconButtonProps={{
              buttonType: 'primary',
              testId: 'team-list.menu.trigger',
            }}
            data-test-id="team-list.menu">
            <DropdownList>
              <DropdownListItem
                onClick={() => setShowDeleteTeamDialog(true)}
                testId="remove-team-button">
                Remove
              </DropdownListItem>
              <DropdownListItem onClick={() => setShowTeamDialog(true)} testId="edit-team-button">
                Edit
              </DropdownListItem>
            </DropdownList>
          </CardActions>
        </TableCell>
      )}
      <TeamDialog
        isShown={showTeamDialog}
        updateTeamDetailsValues={onClose}
        onClose={() => setShowTeamDialog(false)}
        initialTeam={team}
      />
      <DeleteTeamDialog
        onClose={() => {
          setShowDeleteTeamDialog(false);
          onClose();
        }}
        isShown={showDeleteTeamDialog}
        initialTeam={team}
      />
    </TableRow>
  );
}
