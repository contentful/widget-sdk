import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import UserCard from 'app/OrganizationSettings/Users/UserCard.es6';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import { TeamMembership as TeamMembershipPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { TableCell, TableRow, Button } from '@contentful/forma-36-react-components';
import { connect } from 'react-redux';

class TeamMembershipRow extends React.Component {
  static propTypes = {
    membership: TeamMembershipPropType.isRequired,
    readOnlyPermission: PropTypes.bool.isRequired,

    removeMembership: PropTypes.func.isRequired
  };

  render() {
    const { removeMembership, readOnlyPermission } = this.props;
    const {
      sys: { user, createdAt, createdBy }
    } = this.props.membership;

    return (
      <TableRow className="membership-list__item">
        <TableCell>
          <UserCard user={user} />
        </TableCell>
        <TableCell>{moment(createdAt).format('MMMM DD, YYYY')}</TableCell>
        <TableCell>{getUserName(createdBy)}</TableCell>
        {!readOnlyPermission && (
          <TableCell align="right">
            <div className="membership-list__item__menu">
              <Button
                buttonType="muted"
                size="small"
                onClick={removeMembership}
                extraClassNames="membership-list__item__menu__button">
                Remove
              </Button>
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  }
}

export default connect(
  null,
  (dispatch, { membership }) => ({
    removeMembership: () =>
      dispatch({ type: 'REMOVE_TEAM_MEMBERSHIP', payload: { teamMembershipId: membership.sys.id } })
  })
)(TeamMembershipRow);
