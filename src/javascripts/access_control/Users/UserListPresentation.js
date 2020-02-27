import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { SectionHeading, Button, Workbench } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { map } from 'lodash';

import { List } from '@contentful/forma-36-react-components';
import { SpaceMember as SpaceMemberPropType } from 'app/OrganizationSettings/PropTypes';
import NavigationIcon from 'ui/Components/NavigationIcon';
import DocumentTitle from 'components/shared/DocumentTitle';
import FilterPill from 'app/ContentList/Search/FilterPill';
import ValueInput from 'app/ContentList/Search/FilterValueInputs';
import UserListRow from './UserListRow';

import AddUsersToSpaceNote from './AddUsersToSpaceNote';
import { VIEW_LABELS } from './constants';

const styles = {
  workbench: {
    content: css({
      padding: 0,
      scrollBehavior: 'smooth'
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
      setTimeout(() => scrollToRole(roleAnchorEl), 500);
    }
  }, [userGroups, jumpToRole]);

  return (
    <>
      <DocumentTitle title="Users" />
      <Workbench>
        <Workbench.Header
          title={`Users (${spaceUsersCount})`}
          icon={<NavigationIcon name="users" size="large" color="green" />}
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

              <List>
                {members.map(member => (
                  <UserListRow
                    key={member.sys.id}
                    member={member}
                    openRoleChangeDialog={() => openRoleChangeDialog(member, adminCount)}
                    openRemovalConfirmationDialog={() =>
                      openRemovalConfirmationDialog(member, adminCount)
                    }
                    numberOfTeamMemberships={numberOfTeamMemberships}
                    canModifyUsers={canModifyUsers}
                  />
                ))}
              </List>
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
