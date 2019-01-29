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
  Button,
  Tooltip
} from '@contentful/forma-36-react-components';
import Placeholder from 'app/common/Placeholder.es6';
import { getCurrentTeamMembershipList } from 'redux/selectors/teamMemberships.es6';
import { getCurrentTeam, getTeams, hasReadOnlyPermission } from 'redux/selectors/teams.es6';
import { TeamMembership as TeamMembershipPropType } from 'app/OrganizationSettings/PropTypes.es6';
import TeamMembershipForm from './TeamMembershipForm.es6';
import TeamMembershipRow from './TeamMembershipRow.es6';
import TeamMembershipRowPlaceholder from './TeamMembershipRowPlaceholder.es6';

const AddTeamMemberButton = ({ onClick }) => (
  <Button
    testId="add-member-button"
    size="small"
    buttonType="primary"
    disabled={!onClick}
    onClick={onClick}>
    Add a team member
  </Button>
);

AddTeamMemberButton.propTypes = {
  onClick: PropTypes.func
};

const isPlaceholder = ({ sys: { id } }) => id === 'placeholder';

class TeamMemberships extends React.Component {
  static propTypes = {
    readOnlyPermission: PropTypes.bool,
    memberships: PropTypes.arrayOf(TeamMembershipPropType),
    teamName: PropTypes.string
  };

  state = {
    showingForm: false
  };

  toggleForm = () => {
    this.setState({ showingForm: !this.state.showingForm });
  };

  render() {
    const { memberships, teamName, readOnlyPermission } = this.props;
    const { showingForm } = this.state;
    const empty = memberships.length === 0 && !showingForm;
    return (
      <React.Fragment>
        {/* TODO: move these styles to a CSS class  */}
        <header
          style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h3 style={{ marginBottom: 30 }}>Team Members</h3>
          {!showingForm &&
            !empty &&
            (readOnlyPermission ? (
              <Tooltip place="left" content="You don't have permission to add new team members">
                <AddTeamMemberButton disabled />
              </Tooltip>
            ) : (
              <AddTeamMemberButton onClick={this.toggleForm} />
            ))}
        </header>
        {!empty && (
          <Table data-test-id="member-table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Member since</TableCell>
                {!readOnlyPermission && (
                  <React.Fragment>
                    <TableCell>Added by</TableCell>
                    <TableCell />
                  </React.Fragment>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {showingForm && <TeamMembershipForm onClose={this.toggleForm} />}
              {memberships.map(membership =>
                isPlaceholder(membership) ? (
                  <TeamMembershipRowPlaceholder key={membership.sys.id} />
                ) : (
                  <TeamMembershipRow membership={membership} key={membership.sys.id} />
                )
              )}
            </TableBody>
          </Table>
        )}
        {empty && !readOnlyPermission && (
          <Placeholder
            testId="no-members-placeholder"
            title={`Team ${teamName} has no members 🐚`}
            text="They’re not gonna magically appear."
            button={<AddTeamMemberButton onClick={this.toggleForm} />}
          />
        )}
        {empty && readOnlyPermission && (
          <Placeholder
            testId="no-members-placeholder"
            title={`Team ${teamName} has no members 🐚`}
            text="You don't have permission to add members"
          />
        )}
      </React.Fragment>
    );
  }
}

export default connect(state => ({
  memberships: getCurrentTeamMembershipList(state),
  teamName: get(getTeams(state), [getCurrentTeam(state), 'name'], undefined),
  readOnlyPermission: hasReadOnlyPermission(state)
}))(TeamMemberships);
