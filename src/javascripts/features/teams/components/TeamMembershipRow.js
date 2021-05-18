import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import UserCard from 'app/OrganizationSettings/Users/UserCard';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils';
import { TeamMembership as TeamMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { TableCell, TableRow, Button, TextLink } from '@contentful/forma-36-react-components';
import { ReactRouterLink } from 'core/react-routing';

export function TeamMembershipRow({ membership, removeFromTeam, readOnlyPermission, orgId }) {
  const {
    sys: { organizationMembership, user, createdAt, createdBy },
  } = membership;

  return (
    <TableRow className="membership-list__item">
      <TableCell>
        {!readOnlyPermission && organizationMembership ? (
          <ReactRouterLink
            component={TextLink}
            testId="user-text-link"
            route={{
              path: 'organizations.users.detail',
              userId: organizationMembership.sys.id,
              orgId,
            }}>
            <UserCard testId="user-card" user={user} />
          </ReactRouterLink>
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
  orgId: PropTypes.string.isRequired,
  membership: TeamMembershipPropType.isRequired,
  removeFromTeam: PropTypes.func.isRequired,
  readOnlyPermission: PropTypes.bool.isRequired,
};
