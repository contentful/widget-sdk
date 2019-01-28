import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import UserCard from 'app/OrganizationSettings/Users/UserCard.es6';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import { hasReadOnlyPermission } from 'redux/selectors/teams.es6';
import { TeamMembership as TeamMembershipPropType } from 'app/OrganizationSettings/PropTypes.es6';
import { TableCell, TableRow, Button } from '@contentful/forma-36-react-components';

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
          <UserCard testId="user-card" user={user} />
        </TableCell>
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
            </div>
          </TableCell></React.Fragment>
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
      dispatch({ type: 'REMOVE_TEAM_MEMBERSHIP', payload: { teamMembershipId: membership.sys.id } })
  })
)(TeamMembershipRow);
