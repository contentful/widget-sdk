import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { without } from 'lodash';

import { SpaceMembership, User } from '../PropTypes.es6';

import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { create as createSpaceMembershipRepo } from 'access_control/SpaceMembershipRepository.es6';
import ResolveLinks from '../../LinkResolver.es6';

import SpaceMembershipEditor from './SpaceMembershipEditor.es6';
import SpaceMembershipDropDown from './SpaceMembershipDropdown.es6';
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
  orgEndpoint = createOrganizationEndpoint(this.props.orgId);

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

  handleMembershipCreated = (membership, space, role) => {
    const { user, $services } = this.props;

    // In the list of memberships we show the space and the role names
    // This is only possible because we include the space and role information
    // in the GET API request. The same can't be done in a POST request.
    // This is why we have to do it manually here.
    const resolved = ResolveLinks({
      paths: ['sys.space', 'roles'],
      includes: {
        Space: [space],
        Role: [role]
      },
      items: [membership]
    });

    this.setState({
      memberships: [...this.state.memberships, resolved]
    });

    $services.notification.info(`
      ${user.firstName} has been successfully added to the space ${membership.sys.space.sys.id}
    `);
  };

  handleMembershipRemove = async membership => {
    const { memberships } = this.state;
    const { user, $services } = this.props;
    const { notification } = $services;
    const { space } = membership.sys;
    const spaceId = space.sys.id;
    const spaceEndpoint = createSpaceEndpoint(spaceId);
    const repo = createSpaceMembershipRepo(spaceEndpoint);

    try {
      await repo.remove(membership);
    } catch (e) {
      notification.error(e.message);
      return;
    }

    this.setState({
      memberships: without(memberships, membership)
    });

    notification.info(`
      ${user.firstName} is no longer part of the space ${space.name}
    `);
  };

  render() {
    const { user, orgId } = this.props;
    const { memberships } = this.state;

    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width="30%">Space</TableCell>
            <TableCell width="40%">Roles</TableCell>
            <TableCell width="25%">Created at</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {memberships.map(membership => (
            <TableRow key={membership.sys.id}>
              <TableCell>{membership.sys.space.name}</TableCell>
              <TableCell>{this.getRolesInSpace(membership)}</TableCell>
              <TableCell>{this.getFormattedDate(membership.sys.createdAt)}</TableCell>
              <TableCell align="right">
                <SpaceMembershipDropDown
                  membership={membership}
                  onMembershipChange={() => {}}
                  onMembershipRemove={this.handleMembershipRemove}
                />
              </TableCell>
            </TableRow>
          ))}
          <SpaceMembershipEditor
            user={user}
            orgId={orgId}
            onMembershipCreated={this.handleMembershipCreated}
          />
        </TableBody>
      </Table>
    );
  }
}

export default ServicesConsumer('notification')(UserSpaceMemberships);
