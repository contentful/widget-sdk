import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { joinWithAnd } from 'utils/StringUtils';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils';
import { TeamMembership as TeamMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { TableCell, TableRow, Button } from '@contentful/forma-36-react-components';

export function TeamSpaceMembershipRow({
  membership,
  onEdit,
  removeTeamSpaceMembership,
  readOnlyPermission,
}) {
  const {
    sys: { space, createdAt, createdBy },
    roles,
    admin,
  } = membership;

  const getRoleNames = () => {
    if (admin) {
      return 'Admin';
    }
    if (!roles || roles.length === 0) {
      return <em>deleted role</em>;
    }
    return joinWithAnd(roles.map((role) => role.name));
  };

  return (
    <TableRow className="membership-list__item">
      <TableCell>{space.name}</TableCell>
      <TableCell>{getRoleNames()}</TableCell>
      <TableCell testId="created-at-cell">{moment(createdAt).format('MMMM DD, YYYY')}</TableCell>
      {!readOnlyPermission && (
        <React.Fragment>
          <TableCell testId="created-by-cell">{getUserName(createdBy)}</TableCell>
          <TableCell align="right">
            <div className="membership-list__item__menu">
              <Button
                testId="remove-button"
                buttonType="muted"
                size="small"
                onClick={() => removeTeamSpaceMembership(membership)}
                className="membership-list__item__menu__button">
                Remove
              </Button>
              <Button
                testId="edit-button"
                buttonType="muted"
                size="small"
                onClick={() => onEdit(membership)}
                className="membership-list__item__menu__button">
                Edit
              </Button>
            </div>
          </TableCell>
        </React.Fragment>
      )}
    </TableRow>
  );
}

TeamSpaceMembershipRow.propTypes = {
  membership: TeamMembershipPropType.isRequired,
  onEdit: PropTypes.func.isRequired,
  removeTeamSpaceMembership: PropTypes.func.isRequired,
  readOnlyPermission: PropTypes.bool.isRequired,
};
