import React from 'react';
import PropTypes from 'prop-types';
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
import {
  Team as TeamPropType,
  TeamMembership as TeamMemberhsipPropType,
  OrganizationMembership as OrganizationMembershipPropType
} from 'app/OrganizationSettings/PropTypes.es6';
import TeamMembershipForm from './TeamMembershipForm.es6';
import createService from 'app/OrganizationSettings/Teams/TeamService.es6';

export default class TeamMemberships extends React.Component {
  static propTypes = {
    team: TeamPropType.isRequired,
    initialTeamMemberships: PropTypes.arrayOf(TeamMemberhsipPropType).isRequired,
    orgMemberships: PropTypes.arrayOf(OrganizationMembershipPropType).isRequired
  };

  state = {
    memberships: this.props.initialTeamMemberships,
    showingForm: false
  };

  service = createService(this.props.team.sys.organization.sys.id);

  toggleForm = () => {
    this.setState({ showingForm: !this.state.showingForm });
  };

  handleMembershipCreate = data => {
    return this.service.createTeamMembership(this.props.team.sys.id, data.orgMembershipId);
  };

  render() {
    const { orgMemberships } = this.props;
    const { memberships, showingForm } = this.state;
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
            {showingForm && (
              <TeamMembershipForm
                orgMemberships={orgMemberships}
                onMembershipCreate={this.handleMembershipCreate}
                onCancel={this.toggleForm}
              />
            )}
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
