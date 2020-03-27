import React from 'react';
import PropTypes from 'prop-types';
import {
  SkeletonContainer,
  SkeletonImage,
  Icon,
  Card,
  EmptyState,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import UserCard from 'app/OrganizationSettings/Users/UserCard';
import { OrganizationMembership as OrganizationMembershipPropType } from 'app/OrganizationSettings/PropTypes';

const styles = {
  list: css({
    margin: `${tokens.spacingM} 0 0`,
    height: 300,
    overflow: 'auto'
  }),
  availableUser: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacingS} ${tokens.spacingM}`,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorElementLightest
    }
  }),
  selectedUser: css({
    backgroundColor: tokens.colorElementLight,
    '&:hover': { backgroundColor: tokens.colorElementLight }
  })
};

export default function AvailableUsers({
  orgMemberships,
  selectedUsers = [],
  onUserSelected,
  onUserRemoved
}) {
  const isSelected = orgMembership => {
    return selectedUsers.includes(orgMembership);
  };

  const handleChange = (orgMembership, selected) => {
    if (selected) {
      onUserSelected(orgMembership);
    } else {
      onUserRemoved(orgMembership);
    }
  };

  return (
    <Card className={styles.list} padding="none">
      {!orgMemberships && <AvailableUsersSkeleton />}
      {orgMemberships && orgMemberships.length === 0 && (
        <EmptyState
          headingProps={{ text: 'No users found' }}
          descriptionProps={{
            text: 'Notice that you can only add users who are already members of this organization'
          }}
        />
      )}
      {orgMemberships &&
        orgMemberships.map(orgMembership => (
          <UserOption
            key={orgMembership.sys.id}
            orgMembership={orgMembership}
            selected={isSelected(orgMembership)}
            onChange={selected => handleChange(orgMembership, selected)}
          />
        ))}
    </Card>
  );
}
AvailableUsers.propTypes = {
  orgMemberships: PropTypes.arrayOf(OrganizationMembershipPropType),
  selectedUsers: PropTypes.arrayOf(OrganizationMembershipPropType).isRequired,
  onUserSelected: PropTypes.func.isRequired,
  onUserRemoved: PropTypes.func.isRequired
};

function UserOption({ orgMembership, selected, onChange }) {
  return (
    <div
      className={cx(styles.availableUser, { [styles.selectedUser]: selected })}
      onClick={() => onChange(!selected)}
      data-test-id="add-users.user-list.user"
      role="option"
      aria-selected={selected}>
      <UserCard user={orgMembership.sys.user} status={orgMembership.status} size="small" />
      {selected && <Icon icon="CheckCircleTrimmed" color="positive" />}
      {!selected && <Icon icon="PlusCircleTrimmed" color="muted" />}
    </div>
  );
}
UserOption.propTypes = {
  orgMembership: OrganizationMembershipPropType.isRequired,
  selected: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired
};

export function AvailableUsersSkeleton() {
  return (
    <div data-test-id="add-users.user-list.skeleton">
      <UserSkeleton />
      <UserSkeleton />
      <UserSkeleton />
      <UserSkeleton />
      <UserSkeleton />
    </div>
  );
}

function UserSkeleton() {
  const style = css({ margin: `${tokens.spacingM}` });

  return (
    <div className={style}>
      <SkeletonContainer svgHeight={44} clipId="user-avatar">
        <SkeletonImage width={32} height={32} radiusX="100%" radiusY="100%" />
        <SkeletonBodyText numberOfLines={2} width={200} offsetLeft={52} />
      </SkeletonContainer>
    </div>
  );
}
