import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { SectionHeading, Button, Tooltip } from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import pluralize from 'pluralize';

import Icon from 'ui/Components/Icon.es6';
import ContextMenu from 'ui/Components/ContextMenu.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import FilterPill from 'app/ContentList/Search/FilterPill.es6';
import ValueInput from 'app/ContentList/Search/FilterValueInputs.es6';

import AddUsersToSpaceNote from './AddUsersToSpaceNote.es6';
import { VIEW_LABELS } from './constants.es6';

const styles = {
  workbench: {
    content: css({
      padding: 0
    })
  },
  groupSelect: css({
    marginLeft: '67px',
    marginTop: tokens.spacingXl,
    display: 'inline-flex'
  }),
  sidebar: {
    heading: css({
      color: tokens.colorTextLight,
      fontWeight: tokens.fontWeightNormal,
      borderBottom: '1px solid #c3cfd5',
      marginBottom: tokens.spacingXl
    })
  },
  userListGroup: css({
    margin: `${tokens.spacingXl} 0`,
    position: 'relative',
    borderTop: '1px solid #e5ebed',
    h3: {
      fontSize: tokens.fontSizeXl,
      letterSpacing: 'inherit',
      textTransform: 'none',
      margin: 0,
      display: 'inline-block',
      position: 'absolute',
      left: tokens.spacingM,
      top: '-15px',
      background: '#fff',
      padding: `0 ${tokens.spacingS}`,
      minWidth: '40px'
    }
  }),
  user: css({
    display: 'flex',
    marginTop: tokens.spacingL,
    paddingLeft: '67px',
    paddingRight: tokens.spacingXl
  }),
  userName: css({
    display: 'block',
    margin: `${tokens.spacing2Xs} 0`
  }),
  notConfirmed: css({
    fontSize: tokens.fontSizeM,
    color: tokens.colorTextLightest
  }),
  userAvatar: css({
    marginRight: tokens.spacingM
  }),
  userMenu: css({
    marginLeft: 'auto',
    height: 'fit-content'
  })
};

const scrollToRole = roleGroupEl => {
  roleGroupEl.current.scrollIntoView({ block: 'start' });
};

const UserList = ({
  canModifyUsers,
  openSpaceInvitationDialog,
  isInvitingUsersToSpace,
  orgId,
  isOwnerOrAdmin,
  hasTeamsFeature,
  userGroupsByView,
  selectedView,
  spaceUsersCount,
  openRoleChangeDialog,
  openRemovalConfirmationDialog,
  onChangeSelectedView,
  jumpToRole
}) => {
  const userGroups = (userGroupsByView && userGroupsByView[selectedView]) || [];

  const jumpToRoleId = `role-group-${jumpToRole}`;
  const roleAnchorEl = useRef(null);
  useEffect(() => {
    if (userGroupsByView && jumpToRole && roleAnchorEl.current) {
      scrollToRole(roleAnchorEl);
    }
  }, [userGroupsByView, jumpToRole]);

  return (
    <>
      <DocumentTitle title="Users" />
      <Workbench>
        <Workbench.Header
          title={`Users (${spaceUsersCount})`}
          icon={<Icon name="page-users" scale="0.75" />}
          actions={
            <Button
              buttonType="primary"
              testId="add-users-to-space"
              disabled={!canModifyUsers || isInvitingUsersToSpace}
              loading={isInvitingUsersToSpace}
              onClick={openSpaceInvitationDialog}>
              Add users
            </Button>
          }
        />
        <Workbench.Content testId="workbench.main__content" className={styles.workbench.content}>
          <FilterPill
            className={styles.groupSelect}
            filter={{
              label: 'Group by',
              valueInput: ValueInput.Select(
                Object.keys(VIEW_LABELS).map(key => [key, VIEW_LABELS[key]])
              )
            }}
            value={selectedView}
            onChange={onChangeSelectedView}
          />
          {userGroups.map(userGroup => (
            <div key={userGroup.id} className={styles.userListGroup}>
              <span
                id="scroll-to-anchor"
                ref={userGroup.id === jumpToRoleId ? roleAnchorEl : null}
              />
              <SectionHeading element="h3">{userGroup.label}</SectionHeading>
              {userGroup.users.map(user => (
                <div key={user.id} data-test-id="user-list.item" className={styles.user}>
                  <img className={styles.userAvatar} src={user.avatarUrl} width="50" height="50" />
                  <div>
                    <strong data-test-id="user-list.name" className={styles.userName}>
                      {user.name}
                    </strong>
                    {!user.confirmed && (
                      <small className={styles.notConfirmed}>This account is not confirmed</small>
                    )}
                    <div data-test-id="user-list.roles">{user.roleNames}</div>
                  </div>
                  <Tooltip
                    targetWrapperClassName={styles.userMenu}
                    place="left"
                    content={
                      user.numberOfTeamMemberships > 0
                        ? `This user has space access through ${pluralize(
                            'team',
                            user.numberOfTeamMemberships,
                            true
                          )}`
                        : ''
                    }>
                    <ContextMenu
                      buttonProps={{
                        'data-test-id': 'user-list.actions'
                      }}
                      isDisabled={!canModifyUsers || user.numberOfTeamMemberships > 0}
                      items={[
                        {
                          label: 'Change role',
                          action: () => openRoleChangeDialog(user),
                          otherProps: {
                            'data-ui-trigger': 'user-change-role'
                          }
                        },
                        {
                          label: 'Remove from this space',
                          action: () => openRemovalConfirmationDialog(user),
                          otherProps: {
                            'data-ui-trigger': 'user-remove-from-space'
                          }
                        }
                      ]}
                    />
                  </Tooltip>
                </div>
              ))}
            </div>
          ))}
        </Workbench.Content>
        <Workbench.Sidebar position="right">
          <SectionHeading className={styles.sidebar.heading}>
            Adding and managing users
          </SectionHeading>
          <AddUsersToSpaceNote
            {...{
              orgId,
              isOwnerOrAdmin,
              hasTeamsFeature
            }}
          />
        </Workbench.Sidebar>
      </Workbench>
    </>
  );
};

export default UserList;

UserList.propTypes = {
  userGroupsByView: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        users: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string.isRequired,
            avatarUrl: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            confirmed: PropTypes.bool,
            roleNames: PropTypes.string.isRequired,
            numberOfTeamMemberships: PropTypes.number.isRequired
          })
        )
      }).isRequired
    ).isRequired
  ),
  selectedView: PropTypes.string.isRequired,
  orgId: PropTypes.string.isRequired,
  jumpToRole: PropTypes.string,
  canModifyUsers: PropTypes.bool.isRequired,
  isOwnerOrAdmin: PropTypes.bool.isRequired,
  isInvitingUsersToSpace: PropTypes.bool,
  hasTeamsFeature: PropTypes.bool,
  spaceUsersCount: PropTypes.number,
  openSpaceInvitationDialog: PropTypes.func.isRequired,
  openRoleChangeDialog: PropTypes.func.isRequired,
  openRemovalConfirmationDialog: PropTypes.func.isRequired,
  onChangeSelectedView: PropTypes.func.isRequired
};