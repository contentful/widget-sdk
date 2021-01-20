import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import UserCard from 'app/OrganizationSettings/Users/UserCard';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils';
import { TeamMembership as TeamMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { TableCell, TableRow, Button, TextLink } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';

export function TeamMembershipRow({ membership, removeFromTeam, readOnlyPermission }) {
  const {
    sys: { organizationMembership, user, createdAt, createdBy },
  } = membership;

  return (
    <TableRow className="membership-list__item">
      <TableCell>
        {!readOnlyPermission && organizationMembership ? (
          <StateLink
            component={TextLink}
            testId="user-text-link"
            path="account.organizations.users.detail"
            params={{
              userId: organizationMembership.sys.id,
            }}>
            <UserCard testId="user-card" user={user} />
          </StateLink>
        ) : (
          <UserCard testId="user-card" user={user} />
        )}
      </TableCell>
      <TableCell testId="created-at-cell">{moment(createdAt).format('MMMM DD, YYYY')}</TableCell>
      {!readOnlyPermission && (
        <>
          <TableCell testId="created-by-cell">{getUserName(createdBy)}</TableCell>
          <TableCell align="right">
            <div className="membership-list__item__menu">
              <Button
                testId="remove-button"
                buttonType="muted"
                size="small"
                onClick={() => removeFromTeam(membership)}
                className="membership-list__item__menu__button">
                Remove
              </Button>
            </div>
          </TableCell>
        </>
      )}
    </TableRow>
  );
}

TeamMembershipRow.propTypes = {
  membership: TeamMembershipPropType.isRequired,
  removeFromTeam: PropTypes.func.isRequired,
  readOnlyPermission: PropTypes.bool.isRequired,
};