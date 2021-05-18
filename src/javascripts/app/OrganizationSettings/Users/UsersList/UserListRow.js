import React from 'react';
import PropTypes from 'prop-types';
import { startCase } from 'lodash';
import { css } from 'emotion';
import {
  Dropdown,
  DropdownList,
  DropdownListItem,
  IconButton,
  TableCell,
  TableRow,
  TextLink,
} from '@contentful/forma-36-react-components';
import UserCard from '../UserCard';
import { getLastActivityDate, get2FAStatus, getFullNameOrEmail } from '../UserUtils';
import { OrganizationMembership as OrgMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { isPendingMember } from 'utils/MembershipUtils';
import { ReactRouterLink } from 'core/react-routing';

const styles = {
  membershipLink: css({
    textDecoration: 'none',
    ':link': {
      textDecoration: 'none',
    },
  }),
  list: css({ position: 'relative' }),
};

UserListRow.propTypes = {
  orgId: PropTypes.string.isRequired,
  membership: OrgMembershipPropType.isRequired,
  onMembershipRemove: PropTypes.func.isRequired,
  onReinvite: PropTypes.func.isRequired,
};

export function UserListRow({ membership, onMembershipRemove, onReinvite, orgId }) {
  return (
    <TableRow
      key={membership.sys.id}
      className="membership-list__item"
      data-test-id="organization-membership-list-row">
      <TableCell>
        <ReactRouterLink
          route={{ path: 'organizations.users.detail', userId: membership.sys.id, orgId }}
          component={TextLink}
          className={styles.membershipLink}>
          <UserCard user={membership.sys.user} status={membership.sys.status} />
        </ReactRouterLink>
      </TableCell>
      <TableCell>{startCase(membership.role)}</TableCell>
      <TableCell>{getLastActivityDate(membership)}</TableCell>
      <TableCell>{get2FAStatus(membership)}</TableCell>
      <TableCell align="right">
        <UserActions
          orgId={orgId}
          membership={membership}
          onRemove={onMembershipRemove}
          onReinvite={onReinvite}
        />
      </TableCell>
    </TableRow>
  );
}

function UserActions({ membership, onRemove, onReinvite, orgId }) {
  const [isOpen, setOpen] = React.useState(false);
  const userName = getFullNameOrEmail(membership.sys.user);

  const canBeReinvited = isPendingMember(membership);
  const handleAction = (action) => {
    setOpen(false);
    action();
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      toggleElement={
        <IconButton
          testId="userlist.row.actions"
          onClick={() => {
            setOpen(true);
          }}
          label="Actions"
          iconProps={{
            icon: 'MoreHorizontal',
          }}
        />
      }>
      <DropdownList>
        <DropdownListItem
          testId="userlist.row.actions.remove"
          onClick={() => handleAction(onRemove(membership))}>
          {isPendingMember(membership) ? 'Remove user' : `Remove ${userName}`}
        </DropdownListItem>
        <ReactRouterLink
          testId="userlist.row.actions.navigate"
          route={{
            path: 'organizations.users.detail',
            userId: membership.sys.id,
            orgId,
          }}
          component={DropdownListItem}
          className={styles.membershipLink}>
          Edit
        </ReactRouterLink>
        {canBeReinvited && (
          <DropdownListItem
            testId="userlist.row.actions.reinvite"
            onClick={() => handleAction(onReinvite)}>
            Re-send invitation
          </DropdownListItem>
        )}
      </DropdownList>
    </Dropdown>
  );
}
UserActions.propTypes = {
  orgId: PropTypes.string.isRequired,
  membership: OrgMembershipPropType.isRequired,
  onRemove: PropTypes.func.isRequired,
  onReinvite: PropTypes.func.isRequired,
};
