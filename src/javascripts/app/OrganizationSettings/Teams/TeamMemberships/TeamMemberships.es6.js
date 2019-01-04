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
import getCurrentTeamMemberships from 'redux/selectors/getCurrentTeamMemberships.es6';
import { TeamMembership as TeamMembershiPropType } from 'app/OrganizationSettings/PropTypes.es6';
import TeamMembershipForm from './TeamMembershipForm.es6';
import TeamMembershipRow from './TeamMembershipRow.es6';

export default connect(state => ({
  users: getUsers(state),
  memberships: getCurrentTeamMemberships(state)
}))(
  class TeamMemberships extends React.Component {
    static propTypes = {
      memberships: PropTypes.arrayOf(TeamMembershiPropType)
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
      return memberships !== undefined ? (
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
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {showingForm && <TeamMembershipForm close={this.toggleForm} />}
              {memberships.map(membership => (
                <TeamMembershipRow membership={membership} key={membership.sys.id} />
              ))}
            </TableBody>
          </Table>
        </React.Fragment>
      ) : null;
    }
  }
);
