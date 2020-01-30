import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import UserCard from 'app/OrganizationSettings/Users/UserCard';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils';
import { hasReadOnlyPermission } from 'redux/selectors/teams';
import { TeamMembership as TeamMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { TableCell, TableRow, Button, TextLink } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';

class TeamMembershipRow extends React.Component {
  static propTypes = {
    membership: TeamMembershipPropType.isRequired,

    readOnlyPermission: PropTypes.bool.isRequired,
    removeMembership: PropTypes.func.isRequired
  };

  render() {
    const { removeMembership, readOnlyPermission } = this.props;
    const {
      sys: { organizationMembership, user, createdAt, createdBy }
    } = this.props.membership;

    return (
      <TableRow className="membership-list__item">
        <TableCell>
          {readOnlyPermission ? (
            <UserCard testId="user-card" user={user} />
          ) : organizationMembership ? (
            <StateLink
              component={TextLink}
              testId="user-text-link"
              path="account.organizations.users.detail"
              params={{
                userId: organizationMembership.sys.id
              }}>
              <UserCard testId="user-card" user={user} />
            </StateLink>
          ) : (
            <UserCard testId="user-card" user={user} />
          )}
        </TableCell>
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
      dispatch({ type: 'REMOVE_TEAM_MEMBERSHIP', payload: { teamMembershipId: membership.sys.id } })
  })
)(TeamMembershipRow);
