import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { SpaceMembership } from '../PropTypes.es6';

import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell
  // Pill,
  // Button
} from '@contentful/ui-component-library';

export default class UserSpaceMemberships extends React.Component {
  static propTypes = {
    memberships: PropTypes.arrayOf(SpaceMembership)
  };

  getRolesInSpace(membership) {
    if (membership.admin) {
      return 'Admin';
    } else {
      return membership.roles.map(role => role.sys.id).join(', ');
    }
  }

  getFormattedDate(dateString) {
    return moment(dateString, moment.ISO_8601).toISOString();
  }

  render() {
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Space</TableCell>
            <TableCell>Roles</TableCell>
            <TableCell>Created at</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {this.props.memberships.map(membership => (
            <TableRow key={membership.sys.id}>
              <TableCell>{membership.sys.space.sys.id}</TableCell>
              <TableCell>{this.getRolesInSpace(membership)}</TableCell>
              <TableCell>{this.getFormattedDate(membership.sys.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
}
