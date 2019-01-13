import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';
import {
  Table,
  TableHead,
  TableCell,
  TableBody,
  TableRow,
  Button
} from '@contentful/forma-36-react-components';
import Placeholder from 'app/common/Placeholder.es6';
import getCurrentTeamMembershipList from 'redux/selectors/getCurrentTeamMembershipList.es6';
import { getCurrentTeam, getTeams } from 'redux/selectors/teams.es6';
import { TeamMembership as TeamMembershiPropType } from 'app/OrganizationSettings/PropTypes.es6';
import TeamMembershipForm from './TeamMembershipForm.es6';
import TeamMembershipRow from './TeamMembershipRow.es6';
import TeamMembershipRowPlaceholder from './TeamMembershipRowPlaceholder.es6';

class AddTeamMemberButton extends React.Component {
  static propTypes = {
    onClick: PropTypes.func.isRequired
  };

  render() {
    return (
      <Button size="small" buttonType="primary" onClick={this.props.onClick}>
        Add a team member
      </Button>
    );
  }
}

export default connect(state => ({
  memberships: getCurrentTeamMembershipList(state),
  teamName: get(getTeams(state), [getCurrentTeam(state), 'name'], undefined)
}))(
  class TeamMemberships extends React.Component {
    static propTypes = {
      memberships: PropTypes.arrayOf(TeamMembershiPropType),
      teamName: PropTypes.string
    };

    state = {
      showingForm: false
    };

    toggleForm = () => {
      this.setState({ showingForm: !this.state.showingForm });
    };

    render() {
      const { memberships, teamName } = this.props;
      const { showingForm } = this.state;
      const empty = memberships.length === 0 && !showingForm;
      return (
        <React.Fragment>
          {/* TODO: move these styles to a CSS class  */}
          <header
            style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h3 style={{ marginBottom: 30 }}>Team Members</h3>
            {!showingForm && !empty && <AddTeamMemberButton onClick={this.toggleForm} />}
          </header>
          {!empty ? (
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
                {memberships.map(membership =>
                  membership.sys.id === 'placeholder' ? (
                    <TeamMembershipRowPlaceholder key={membership.sys.id} />
                  ) : (
                    <TeamMembershipRow membership={membership} key={membership.sys.id} />
                  )
                )}
              </TableBody>
            </Table>
          ) : (
            <Placeholder
              title={`Team ${teamName} has no members 🐚`}
              text="They’re not gonna magically appear."
              button={<AddTeamMemberButton onClick={this.toggleForm} />}
            />
          )}
        </React.Fragment>
      );
    }
  }
);
