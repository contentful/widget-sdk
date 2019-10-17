import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { SectionHeading, Button, Tooltip } from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import pluralize from 'pluralize';
import { map, isEmpty } from 'lodash';

import { SpaceMember as SpaceMemberPropType } from 'app/OrganizationSettings/PropTypes.es6';
import Icon from 'ui/Components/Icon.es6';
import ContextMenu from 'ui/Components/ContextMenu.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import FilterPill from 'app/ContentList/Search/FilterPill.es6';
import ValueInput from 'app/ContentList/Search/FilterValueInputs.es6';
import { joinAnd } from 'utils/StringUtils.es6';

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

const UserListPresentation = ({
  canModifyUsers,
  openSpaceInvitationDialog,
  isInvitingUsersToSpace,
  orgId,
  isOwnerOrAdmin,
  hasTeamsFeature,
  userGroups,
  selectedView,
  spaceUsersCount,
  openRoleChangeDialog,
  openRemovalConfirmationDialog,
  onChangeSelectedView,
  jumpToRole,
  numberOfTeamMemberships,
  adminCount
}) => {
  const roleAnchorEl = useRef(null);
  useEffect(() => {
    if (userGroups && jumpToRole && roleAnchorEl.current) {
      scrollToRole(roleAnchorEl);
    }
  }, [userGroups, jumpToRole]);

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
          {map(userGroups, (members, label) => (
            <div key={label} className={styles.userListGroup}>
              <span id="scroll-to-anchor" ref={label === jumpToRole ? roleAnchorEl : null} />
              <SectionHeading element="h3">{label}</SectionHeading>
              {members.map(member => {
                const {
                  sys: {
                    id,
                    user: { avatarUrl, firstName, lastName, email, activated }
                  },
                  roles
                } = member;
                const displayName = firstName || lastName ? `${firstName} ${lastName}` : email;
                const displayRoles = isEmpty(roles) ? 'Administrator' : joinAnd(map(roles, 'name'));

                return (
                  <div key={id} data-test-id="user-list.item" className={styles.user}>
                    <img
                      className={styles.userAvatar}
                      src={avatarUrl}
                      width="50"
                      height="50"
                      alt="user avatar"
                    />
                    <div>
                      <strong data-test-id="user-list.name" className={styles.userName}>
                        {displayName}
                      </strong>
                      {!activated && (
                        <small className={styles.notConfirmed}>This account is not confirmed</small>
                      )}
                      <div data-test-id="user-list.roles">{displayRoles}</div>
                    </div>
                    <Tooltip
                      targetWrapperClassName={styles.userMenu}
                      place="left"
                      content={
                        numberOfTeamMemberships[id] > 0
                          ? `This user has space access through ${pluralize(
                              'team',
                              numberOfTeamMemberships[id],
                              true
                            )}`
                          : ''
                      }>
                      <ContextMenu
                        buttonProps={{
                          'data-test-id': 'user-list.actions'
                        }}
                        isDisabled={!canModifyUsers || numberOfTeamMemberships[id] > 0}
                        items={[
                          {
                            label: 'Change role',
                            action: () => openRoleChangeDialog(member, adminCount),
                            otherProps: {
                              'data-test-id': 'user-change-role'
                            }
                          },
                          {
                            label: 'Remove from this space',
                            action: () => openRemovalConfirmationDialog(member, adminCount),
                            otherProps: {
                              'data-test-id': 'user-remove-from-space'
                            }
                          }
                        ]}
                      />
                    </Tooltip>
                  </div>
                );
              })}
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

export default UserListPresentation;

UserListPresentation.propTypes = {
  userGroups: PropTypes.objectOf(PropTypes.arrayOf(SpaceMemberPropType)).isRequired,
  numberOfTeamMemberships: PropTypes.objectOf(PropTypes.number).isRequired,
  selectedView: PropTypes.string.isRequired,
  orgId: PropTypes.string.isRequired,
  jumpToRole: PropTypes.string,
  canModifyUsers: PropTypes.bool.isRequired,
  isOwnerOrAdmin: PropTypes.bool.isRequired,
  isInvitingUsersToSpace: PropTypes.bool,
  hasTeamsFeature: PropTypes.bool,
  spaceUsersCount: PropTypes.number.isRequired,
  openSpaceInvitationDialog: PropTypes.func.isRequired,
  openRoleChangeDialog: PropTypes.func.isRequired,
  openRemovalConfirmationDialog: PropTypes.func.isRequired,
  onChangeSelectedView: PropTypes.func.isRequired,
  adminCount: PropTypes.number.isRequired
};
