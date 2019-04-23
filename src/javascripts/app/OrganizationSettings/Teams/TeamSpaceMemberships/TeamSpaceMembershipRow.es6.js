import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import { get, keyBy } from 'lodash';
import { css } from 'emotion';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import { hasReadOnlyPermission } from 'redux/selectors/teams.es6';
import * as types from 'app/OrganizationSettings/PropTypes.es6';
import { TableCell, TableRow, Button, Spinner } from '@contentful/forma-36-react-components';
import { joinWithAnd } from 'utils/StringUtils.es6';
import getRolesBySpace from 'redux/selectors/getRolesBySpace.es6';

class TeamMembershipRow extends React.Component {
  static propTypes = {
    membership: PropTypes.oneOfType([
      types.TeamSpaceMembership,
      types.TeamSpaceMembershipPlaceholder
    ]).isRequired,
    onEdit: PropTypes.func.isRequired,

    roles: PropTypes.objectOf(PropTypes.arrayOf(types.SpaceRole)),
    readOnlyPermission: PropTypes.bool.isRequired,
    removeMembership: PropTypes.func.isRequired
  };

  getRoleNames() {
    const { membership, roles } = this.props;
    const spaceId = get(membership, 'sys.space.sys.id');
    const spaceRoles = keyBy(roles[spaceId], 'sys.id');

    if (membership.admin) {
      return 'Admin';
    }
    if (membership.roles.length === 0) {
      return <span className={css({ fontStyle: 'italic' })}>deleted role</span>;
    }
    return joinWithAnd(membership.roles.map(role => spaceRoles[role.sys.id].name));
  }

  render() {
    const { membership, onEdit, removeMembership, readOnlyPermission } = this.props;
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
  state => ({
    readOnlyPermission: hasReadOnlyPermission(state),
    roles: getRolesBySpace(state)
  }),
  (dispatch, { membership }) => ({
    removeMembership: () =>
      dispatch({
        type: 'REMOVE_TEAM_SPACE_MEMBERSHIP',
        payload: { teamSpaceMembershipId: membership.sys.id }
      })
  })
)(TeamMembershipRow);
