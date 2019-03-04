import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import * as types from 'app/OrganizationSettings/PropTypes.es6';
import { hasReadOnlyPermission } from 'redux/selectors/teams.es6';
import { getCurrentTeamSpaceMembershipList } from 'redux/selectors/teamSpaceMemberships.es6';
import TeamSpaceMembershipForm from './TeamSpaceMembershipForm.es6';
import TeamSpaceMembershipRow from './TeamSpaceMembershipRow.es6';

import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@contentful/forma-36-react-components';

export class TeamSpaceMemberships extends React.Component {
  static propTypes = {
    showingForm: PropTypes.bool.isRequired,
    onFormDismissed: PropTypes.func.isRequired,
    memberships: PropTypes.arrayOf(
      PropTypes.oneOfType([types.TeamSpaceMembership, types.TeamSpaceMembershipPlaceholder])
    )
  };

  state = {
    editingMembershipId: null
  };

  render() {
    const { memberships, showingForm, onFormDismissed } = this.props;
    const { editingMembershipId } = this.state;

    return (
      <Table
        style={{ marginBottom: 20, tableLayout: 'fixed' }}
        data-test-id="user-memberships-table">
        <TableHead>
          <TableRow>
            <TableCell>Space</TableCell>
            <TableCell>Space roles</TableCell>
            <TableCell>Created by</TableCell>
            <TableCell>Created at</TableCell>
            <TableCell width="200px" />
          </TableRow>
        </TableHead>
        <TableBody>
          {showingForm && <TeamSpaceMembershipForm onClose={onFormDismissed} />}
          {memberships.map(membership =>
            editingMembershipId === membership.sys.id ? (
              <TeamSpaceMembershipForm
                key={membership.sys.id}
                initialMembership={membership}
                onClose={() => this.setState({ editingMembershipId: null })}
              />
            ) : (
              <TeamSpaceMembershipRow
                key={membership.sys.id}
                membership={membership}
                onEdit={() => this.setState({ editingMembershipId: membership.sys.id })}
              />
            )
          )}
        </TableBody>
      </Table>
    );
  }
}

export default connect(state => ({
  readOnlyPermission: hasReadOnlyPermission(state),
  memberships: getCurrentTeamSpaceMembershipList(state)
}))(TeamSpaceMemberships);
