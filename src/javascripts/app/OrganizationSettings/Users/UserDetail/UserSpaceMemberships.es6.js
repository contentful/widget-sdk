import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { SpaceMembership, User } from '../PropTypes.es6';

import SpaceMembershipEditor from './SpaceMembershipEditor.es6';
import { Table, TableRow, TableHead, TableBody, TableCell } from '@contentful/ui-component-library';

const ServicesConsumer = require('../../../../reactServiceContext').default;

class UserSpaceMemberships extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      notification: PropTypes.object.isRequired
    }).isRequired,
    initialMemberships: PropTypes.arrayOf(SpaceMembership),
    user: User.isRequired,
    orgId: PropTypes.string
  };

  state = { memberships: this.props.initialMemberships };

  getRolesInSpace(membership) {
    if (membership.admin) {
      return 'Admin';
    } else {
      return membership.roles.map(role => role.name).join(', ');
    }
  }

  getFormattedDate(dateString) {
    return moment(dateString, moment.ISO_8601).toISOString();
  }

  handleMembershipCreated(membership) {
    const { user, $services } = this.props;

    this.setState({
      memberships: [...this.state.memberships, membership]
    });

    $services.notification.info(`
      ${user.firstName} has been successfully added to the space ${membership.sys.space.sys.id}
    `);
  }

  render() {
    const { user, orgId } = this.props;
    const { memberships } = this.state;
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
          {memberships.map(membership => (
            <TableRow key={membership.sys.id}>
              <TableCell>{membership.sys.space.name}</TableCell>
              <TableCell>{this.getRolesInSpace(membership)}</TableCell>
              <TableCell>{this.getFormattedDate(membership.sys.createdAt)}</TableCell>
            </TableRow>
          ))}
          <SpaceMembershipEditor
            user={user}
            orgId={orgId}
            onMembershipCreated={membership => this.handleMembershipCreated(membership)}
          />
        </TableBody>
      </Table>
    );
  }
}

export default ServicesConsumer('notification')(UserSpaceMemberships);
