import React from 'react';
import {
  Table,
  TableHead,
  TableCell,
  TableBody,
  TableRow,
  Button
} from '@contentful/forma-36-react-components';
import UserCard from 'app/OrganizationSettings/Users/UserCard.es6';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import moment from 'moment';
import { Team as TeamPropType } from 'app/OrganizationSettings/PropTypes.es6';
import TeamMembershipForm from './TeamMembershipForm.es6';

export default class TeamMemberships extends React.Component {
  static propTypes = {
    memberships: TeamPropType.isRequired
  };

  state = {
    showingForm: false
  };

  toggleForm = () => {
    this.setState({ showingForm: !this.state.showingForm });
  };

  render() {
    const { memberships } = this.props;
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
            {showingForm && <TeamMembershipForm onCancel={this.toggleForm} />}
            {memberships.map(membership => (
              <TableRow key={membership.sys.id}>
                <TableCell>
                  <UserCard user={membership.sys.user} />
                </TableCell>
                <TableCell>{moment(membership.sys.createdAt).format('MMMM DD, YYYY')}</TableCell>
                <TableCell>{getUserName(membership.sys.createdBy)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </React.Fragment>
    );
  }
}
