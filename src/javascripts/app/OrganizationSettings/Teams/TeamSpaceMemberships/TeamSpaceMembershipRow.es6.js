import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import { hasReadOnlyPermission } from 'redux/selectors/teams.es6';
import * as types from 'app/OrganizationSettings/PropTypes.es6';
import { TableCell, TableRow, Button, Spinner } from '@contentful/forma-36-react-components';
import { getSpaceMembershipRoleNames } from 'access_control/utils.es6';
import { joinWithAnd } from 'utils/StringUtils.es6';

class TeamMembershipRow extends React.Component {
  static propTypes = {
    membership: PropTypes.oneOfType([
      types.TeamSpaceMembership,
      types.TeamSpaceMembershipPlaceholder
    ]).isRequired,
    readOnlyPermission: PropTypes.bool.isRequired,
    removeMembership: PropTypes.func.isRequired
  };

  render() {
    const { membership, removeMembership, readOnlyPermission } = this.props;
    const {
      sys: { space, createdAt, createdBy, id }
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
        <TableCell>{joinWithAnd(getSpaceMembershipRoleNames(membership))}</TableCell>
        <TableCell data-test-id="created-at-cell">
          {moment(createdAt).format('MMMM DD, YYYY')}
        </TableCell>
        {!readOnlyPermission && (
          <React.Fragment>
            <TableCell data-test-id="created-by-cell">{getUserName(createdBy)}</TableCell>
            <TableCell align="right">
              <div className="membership-list__item__menu">
                <Button
                  testId="remove-button"
                  buttonType="muted"
                  size="small"
                  onClick={removeMembership}
                  extraClassNames="membership-list__item__menu__button">
                  Remove
                </Button>
                <Button
                  testId="remove-button"
                  buttonType="muted"
                  size="small"
                  onClick={this.editMembership}
                  extraClassNames="membership-list__item__menu__button">
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
  state => ({
    readOnlyPermission: hasReadOnlyPermission(state)
  }),
  (dispatch, { membership }) => ({
    removeMembership: () =>
      dispatch({
        type: 'REMOVE_TEAM_SPACE_MEMBERSHIP',
        payload: { teamSpaceMembershipId: membership.sys.id }
      })
  })
)(TeamMembershipRow);
