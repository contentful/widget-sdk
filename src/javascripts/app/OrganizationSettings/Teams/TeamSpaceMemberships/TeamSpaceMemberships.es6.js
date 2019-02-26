import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { get } from 'lodash';
import * as types from 'app/OrganizationSettings/PropTypes.es6';
import { getCurrentTeam, getTeams, hasReadOnlyPermission } from 'redux/selectors/teams.es6';

import Placeholder from 'app/common/Placeholder.es6';

import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@contentful/forma-36-react-components';

export class TeamSpaceMemberships extends React.Component {
  static propTypes = {
    memberships: PropTypes.arrayOf(types.TeamSpaceMembership),
    team: types.Team
  };

  render() {
    const { team, memberships } = this.props;
    const empty = !memberships || memberships.length === 0;

    return !empty ? (
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
        <TableBody />
      </Table>
    ) : (
      <Placeholder
        testId="no-members-placeholder"
        title={`Team ${team.name} is not in any space yet 🐚`}
        text=""
      />
    );
  }
}

export default connect(state => ({
  team: get(getTeams(state), [getCurrentTeam(state)], undefined),
  readOnlyPermission: hasReadOnlyPermission(state)
}))(TeamSpaceMemberships);
