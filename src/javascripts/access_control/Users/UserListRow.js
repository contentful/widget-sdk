import React from 'react';
import PropTypes from 'prop-types';

import { map, isEmpty } from 'lodash';
import { joinAnd } from 'utils/StringUtils';

import tokens from '@contentful/forma-36-tokens';

import { css } from 'emotion';
import { SpaceMember as SpaceMemberPropType } from 'app/OrganizationSettings/PropTypes';
import pluralize from 'pluralize';
import {
  CardActions,
  DropdownList,
  DropdownListItem,
  Tooltip,
} from '@contentful/forma-36-react-components';
import UserCard from 'app/OrganizationSettings/Users/UserCard';

const styles = {
  user: css({
    display: 'flex',
    marginTop: tokens.spacingL,
    paddingLeft: '67px',
    paddingRight: tokens.spacingXl,
  }),
  userName: css({
    display: 'block',
    margin: `${tokens.spacing2Xs} 0`,
  }),
  notConfirmed: css({
    fontSize: tokens.fontSizeM,
    color: tokens.colorTextLightest,
  }),
  userAvatar: css({
    marginRight: tokens.spacingM,
  }),
  userMenu: css({
    marginLeft: 'auto',
    height: 'fit-content',
  }),
};

const UserListRow = ({
  member,
  openRoleChangeDialog,
  openRemovalConfirmationDialog,
  numberOfTeamMemberships,
  canModifyUsers,
}) => {
  const {
    sys: { id, user },
    roles,
  } = member;

  // const displayName = getUserName(member.sys.user);
  const displayRoles = isEmpty(roles) ? 'Administrator' : joinAnd(map(roles, 'name'));
  const toolTipContent =
    numberOfTeamMemberships[id] > 0
      ? `This user has space access through ${pluralize('team', numberOfTeamMemberships[id], true)}`
      : '';

  return (
    <li data-test-id="user-list.item" className={styles.user}>
      <UserCard
        user={user}
        status={member.sys.status}
        description={displayRoles}
        displayEmail={false}
      />
      <Tooltip place="auto" targetWrapperClassName={styles.userMenu} content={toolTipContent}>
        <CardActions
          iconButtonProps={{ buttonType: 'primary', testId: 'user-list.actions' }}
          data-test-id="user-list.menu"
          isDisabled={!canModifyUsers || numberOfTeamMemberships[id] > 0}>
          <DropdownList>
            <DropdownListItem onClick={openRoleChangeDialog} testId="user-change-role">
              Change role
            </DropdownListItem>
            <DropdownListItem
              onClick={openRemovalConfirmationDialog}
              testId="user-remove-from-space">
              Remove from this space
            </DropdownListItem>
          </DropdownList>
        </CardActions>
      </Tooltip>
    </li>
  );
};

UserListRow.propTypes = {
  member: SpaceMemberPropType.isRequired,
  canModifyUsers: PropTypes.bool.isRequired,
  openRoleChangeDialog: PropTypes.func.isRequired,
  numberOfTeamMemberships: PropTypes.objectOf(PropTypes.number).isRequired,
  openRemovalConfirmationDialog: PropTypes.func.isRequired,
};

export default UserListRow;
