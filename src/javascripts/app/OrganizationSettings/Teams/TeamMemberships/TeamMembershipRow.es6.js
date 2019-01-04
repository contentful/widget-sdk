import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import UserCard from 'app/OrganizationSettings/Users/UserCard.es6';
import { getUsers } from 'redux/selectors/users.es6';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import {
  TeamMembership as TeamMembershipPropType,
  User as UserPropType
} from 'app/OrganizationSettings/PropTypes.es6';
import { TableCell, TableRow, Button } from '@contentful/forma-36-react-components';
import { connect } from 'react-redux';

export default connect(
  state => ({
    users: getUsers(state)
  }),
  (dispatch, { membership }) => ({
    removeMembership: () =>
      dispatch({ type: 'REMOVE_TEAM_MEMBERSHIP', payload: { teamMembershipId: membership.sys.id } })
  })
)(
  class TeamMembershipRow extends React.Component {
    static propTypes = {
      users: PropTypes.objectOf(UserPropType).isRequired,
      membership: TeamMembershipPropType.isRequired,
      removeMembership: PropTypes.func.isRequired
    };

    render() {
      const { users, removeMembership } = this.props;
      const {
        sys: {
          id,
          user: {
            sys: { id: userId }
          },
          createdAt,
          createdBy: {
            sys: { id: creatorId }
          }
        }
      } = this.props.membership;

      return (
        <TableRow key={id} className="membership-list__item">
          <TableCell>
            <UserCard user={users[userId]} />
          </TableCell>
          <TableCell>{moment(createdAt).format('MMMM DD, YYYY')}</TableCell>
          <TableCell>{getUserName(users[creatorId] || creatorId)}</TableCell>
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
        </TableRow>
      );
    }
  }
);
