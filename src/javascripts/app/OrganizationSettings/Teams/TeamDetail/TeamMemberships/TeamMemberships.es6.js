import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableHead,
  TableCell,
  TableBody,
  TableRow
} from '@contentful/forma-36-react-components';
import UserCard from 'app/OrganizationSettings/Users/UserCard.es6';
import { getUserName } from 'app/OrganizationSettings/Users/UserUtils.es6';
import moment from 'moment';
import { TeamMembership as TeamMemberhsipPropType } from 'app/OrganizationSettings/PropTypes.es6';

export default class TeamMemberhips extends React.Component {
  static propTypes = {
    initialTeamMemberships: PropTypes.arrayOf(TeamMemberhsipPropType).isRequired
  };

  state = {
    memberships: this.props.initialTeamMemberships
  };

  render() {
    const { memberships } = this.state;
    return (
      <React.Fragment>
        <h3 style={{ marginBottom: 30 }}>Members</h3>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Member since</TableCell>
              <TableCell>Added by</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {memberships.map(membership => {
              <TableRow key={membership.sys.id}>
                <TableCell>
                  <UserCard user={membership.sys.user} />
                </TableCell>
                <TableCell>{moment(membership.sys.createdAt).format('MMMM DD, YYYY')}</TableCell>
                <TableCell>{getUserName(membership.sys.createdBy)}</TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table>
      </React.Fragment>
    );
  }
}
