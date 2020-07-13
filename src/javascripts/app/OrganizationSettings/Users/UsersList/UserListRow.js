import React from 'react';
import PropTypes from 'prop-types';
import { startCase } from 'lodash';
import { css } from 'emotion';
import { Button, TableCell, TableRow, TextLink } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';
import UserCard from '../UserCard';
import { getLastActivityDate, get2FAStatus } from '../UserUtils';
import { OrganizationMembership as OrgMembershipPropType } from 'app/OrganizationSettings/PropTypes';

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
  membership: OrgMembershipPropType.isRequired,
  onMembershipRemove: PropTypes.func.isRequired,
};

export function UserListRow({ membership, onMembershipRemove }) {
  const getLinkToUser = (user) => {
    return {
      path: 'account.organizations.users.detail',
      params: {
        userId: user.sys.id,
      },
    };
  };

  return (
    <TableRow
      key={membership.sys.id}
      className="membership-list__item"
      data-test-id="organization-membership-list-row">
      <TableCell>
        <StateLink
          component={TextLink}
          {...getLinkToUser(membership)}
          className={styles.membershipLink}>
          <UserCard user={membership.sys.user} status={membership.sys.status} />
        </StateLink>
      </TableCell>
      <TableCell>{startCase(membership.role)}</TableCell>
      <TableCell>{getLastActivityDate(membership)}</TableCell>
      <TableCell>{get2FAStatus(membership)}</TableCell>
      <TableCell align="right">
        <div className="membership-list__item__menu">
          <Button
            buttonType="muted"
            size="small"
            onClick={onMembershipRemove(membership)}
            className="membership-list__item__menu__button">
            Remove
          </Button>
          <StateLink
            component={Button}
            buttonType="muted"
            size="small"
            href={getLinkToUser(membership)}
            className="membership-list__item__menu__button"
            {...getLinkToUser(membership)}>
            Edit
          </StateLink>
        </div>
      </TableCell>
    </TableRow>
  );
}
