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
import getMembershipsOfCurrentTeamToDisplay from 'redux/selectors/teamMemberships/getMembershipsOfCurrentTeamToDisplay';
import { getCurrentTeam, getTeams, hasReadOnlyPermission } from 'redux/selectors/teams';
import { TeamMembership as TeamMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import TeamMembershipForm from './TeamMembershipForm';
import TeamMembershipRow from './TeamMembershipRow';
import TeamMembershipRowPlaceholder from './TeamMembershipRowPlaceholder';

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
    showingForm: PropTypes.bool.isRequired,
    onFormDismissed: PropTypes.func.isRequired,
    readOnlyPermission: PropTypes.bool,
    memberships: PropTypes.arrayOf(TeamMembershipPropType),
    teamName: PropTypes.string
  };

  render() {
    const { showingForm, onFormDismissed, memberships, readOnlyPermission } = this.props;

    return (
      <React.Fragment>
        <Table testId="member-table">
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
            {showingForm && <TeamMembershipForm onClose={onFormDismissed} />}
            {memberships.map((membership, index) =>
              isPlaceholder(membership) ? (
                <TeamMembershipRowPlaceholder key={index} />
              ) : (
                <TeamMembershipRow membership={membership} key={membership.sys.id} />
              )
            )}
          </TableBody>
        </Table>
      </React.Fragment>
    );
  }
}

export default connect(state => ({
  memberships: getMembershipsOfCurrentTeamToDisplay(state),
  teamName: get(getTeams(state), [getCurrentTeam(state), 'name'], undefined),
  readOnlyPermission: hasReadOnlyPermission(state)
}))(TeamMemberships);