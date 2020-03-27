import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils';
import { hasReadOnlyPermission } from 'redux/selectors/teams';
import * as types from 'app/OrganizationSettings/PropTypes';
import { TableCell, TableRow, Button, Spinner } from '@contentful/forma-36-react-components';
import { joinWithAnd } from 'utils/StringUtils';

class TeamMembershipRow extends React.Component {
  static propTypes = {
    membership: PropTypes.oneOfType([
      types.TeamSpaceMembership,
      types.TeamSpaceMembershipPlaceholder,
    ]).isRequired,
    onEdit: PropTypes.func.isRequired,
    readOnlyPermission: PropTypes.bool.isRequired,
    removeMembership: PropTypes.func.isRequired,
  };

  getRoleNames() {
    const { membership } = this.props;

    if (membership.admin) {
      return 'Admin';
    }
    if (!membership.roles || membership.roles.length === 0) {
      return <em>deleted role</em>;
    }
    return joinWithAnd(membership.roles.map((role) => role.name));
  }

  render() {
    const { membership, onEdit, removeMembership, readOnlyPermission } = this.props;
    const {
      sys: { space, createdAt, createdBy, id },
    } = this.props.membership;
    const isPlaceholder = id === 'placeholder';

    if (isPlaceholder) {
      return (
        <TableRow>
          <TableCell colSpan="4">
            <Spinner size="small" />
          </TableCell>
        </TableRow>
      );
    }

    return (
      <TableRow className="membership-list__item">
        <TableCell>{space.name}</TableCell>
        <TableCell>{this.getRoleNames()}</TableCell>
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
                  onClick={removeMembership}
                  className="membership-list__item__menu__button">
                  Remove
                </Button>
                <Button
                  testId="remove-button"
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
}

export default connect(
  (state) => ({
    readOnlyPermission: hasReadOnlyPermission(state),
  }),
  (dispatch, { membership }) => ({
    removeMembership: () =>
      dispatch({
        type: 'REMOVE_TEAM_SPACE_MEMBERSHIP',
        payload: { teamSpaceMembershipId: membership.sys.id },
      }),
  })
)(TeamMembershipRow);
