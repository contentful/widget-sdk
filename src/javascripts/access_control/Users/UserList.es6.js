import React from 'react';
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
    marginLeft: tokens.spacing2Xl,
    marginTop: tokens.spacingM,
    width: 'fit-content'
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
    paddingLeft: tokens.spacing2Xl,
    paddingRight: tokens.spacingXl
  }),
  userAvater: css({
    marginRight: tokens.spacingM
  }),
  userMenu: css({
    marginLeft: 'auto'
  })
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
  onChangeSelectedView
}) => {
  const userGroups = (userGroupsByView && userGroupsByView[selectedView]) || [];

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
        <Workbench.Content className={styles.workbench.content}>
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
              <SectionHeading element="h3">{userGroup.label}</SectionHeading>
              {userGroup.users.map(user => (
                <div key={user.id} className={styles.user}>
                  <img className={styles.userAvater} src={user.avatarUrl} width="50" height="50" />
                  <div>
                    <strong>{user.name}</strong>
                    {!user.confirmed && <small>This account is not confirmed</small>}
                    <div>{user.roleNames}</div>
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
