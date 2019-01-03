import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Table,
  TableHead,
  TableCell,
  TableBody,
  TableRow,
  Button
} from '@contentful/forma-36-react-components';
import { getUsers } from 'redux/selectors/users.es6';
import UserCard from 'app/OrganizationSettings/Users/UserCard.es6';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import moment from 'moment';
import { Team as TeamPropType, User as UserPropType } from 'app/OrganizationSettings/PropTypes.es6';
import TeamMembershipForm from './TeamMembershipForm.es6';

export default connect(state => ({
  users: getUsers(state)
}))(
  class TeamMemberships extends React.Component {
    static propTypes = {
      memberships: PropTypes.arrayOf(TeamPropType).isRequired,
      users: PropTypes.objectOf(UserPropType).isRequired
    };

    state = {
      showingForm: false
    };

    toggleForm = () => {
      this.setState({ showingForm: !this.state.showingForm });
    };

    render() {
      const { memberships, users } = this.props;
      const { showingForm } = this.state;
      return (
        <React.Fragment>
          {/* TODO: move these styles to a CSS class  */}
          <header
            style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h3 style={{ marginBottom: 30 }}>Members</h3>
            {!showingForm && (
              <Button size="small" buttonType="primary" onClick={this.toggleForm}>
                Add a team member
              </Button>
            )}
          </header>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Member since</TableCell>
                <TableCell>Added by</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {showingForm && <TeamMembershipForm close={this.toggleForm} />}
              {memberships.map(
                ({
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
                }) => (
                  <TableRow key={id}>
                    <TableCell>
                      <UserCard user={users[userId]} />
                    </TableCell>
                    <TableCell>{moment(createdAt).format('MMMM DD, YYYY')}</TableCell>
                    <TableCell>{getUserName(users[creatorId] || creatorId)}</TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </React.Fragment>
      );
    }
  }
);
