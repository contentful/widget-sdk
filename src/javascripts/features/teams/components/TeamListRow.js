import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import pluralize from 'pluralize';
import { css } from 'emotion';
import StateLink from 'app/common/StateLink';
import {
  TextLink,
  TableRow,
  TableCell,
  Spinner,
  CardActions,
  DropdownList,
  DropdownListItem,
} from '@contentful/forma-36-react-components';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes';
import { TeamDialog } from './TeamDialog';
import { DeleteTeamDialog } from './DeleteTeamDialog';

const ellipsisStyle = {
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

TeamListRow.propTypes = {
  team: TeamPropType.isRequired,
  readOnlyPermission: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export function TeamListRow({ team, onClose, readOnlyPermission }) {
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showDeleteTeamDialog, setShowDeleteTeamDialog] = useState(false);
  const teamId = get(team, 'sys.id');

  return (
    <TableRow>
      <TableCell>
        <div className={styles.name}>
          {teamId !== 'placeholder' ? (
            <StateLink
              component={TextLink}
              path="account.organizations.teams.detail"
              key={teamId}
              params={{ teamId }}
              data-test-id="team-name">
              {team.name}
            </StateLink>
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
        testId="team-edit-dialog"
        isShown={showTeamDialog}
        updateTeamDetailsValues={onClose}
        onClose={() => setShowTeamDialog(false)}
        initialTeam={team}
      />
      <DeleteTeamDialog
        testId="delete-team-dialog"
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
