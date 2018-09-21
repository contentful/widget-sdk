import React from 'react';
import PropTypes from 'prop-types';
import { startCase, without } from 'lodash';
import pluralize from 'pluralize';
import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Pill,
  Button
} from '@contentful/ui-component-library';
import Workbench from 'ui/Components/Workbench/JSX.es6';
import UserDropdown from './UserDropdown.es6';
import createResourceService from 'services/ResourceService.es6';
import { href, go } from 'states/Navigator.es6';
import {
  getAllUsers,
  getAllMemberships,
  removeMembership
} from 'access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

const ServicesConsumer = require('../../../../reactServiceContext').default;

class UsersList extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      notification: PropTypes.object
    }),
    orgId: PropTypes.string.isRequired,
    context: PropTypes.any
  };

  state = {
    usersList: [],
    membershipsResource: null
  };

  endpoint = createOrganizationEndpoint(this.props.orgId);

  async componentDidMount() {
    const { orgId } = this.props;
    const resources = createResourceService(orgId, 'organization');
    const [users, memberships, membershipsResource] = await Promise.all([
      getAllUsers(this.endpoint),
      getAllMemberships(this.endpoint),
      resources.get('organization_membership')
    ]);
    const getMembershipUser = membership => {
      return users.find(user => user.sys.id === membership.user.sys.id);
    };

    const usersList = memberships.map(membership => ({
      ...membership,
      user: getMembershipUser(membership)
    }));

    this.props.context.ready = true;
    this.setState({ usersList, membershipsResource });
  }

  getLinkToInvitation() {
    return href({
      path: ['account', 'organizations', 'users', 'new'],
      params: { orgId: this.props.orgId }
    });
  }

  // TODO: temporarily using the membership id instead of the user id
  // as a route param.
  // This should be changed after `include` is implemented in the backend
  // so that we can get the linked membership from the user endpoint response
  goToUser(user) {
    go({
      path: ['account', 'organizations', 'users', 'detail'],
      params: { userId: user.sys.id }
    });
  }

  async handleMembershipRemove(membership) {
    const { notification } = this.props.$services;
    const { usersList } = this.state;
    const { firstName } = membership.user;
    const message = firstName
      ? `${firstName} has been successfully removed from this organization`
      : `Membership successfully removed`;

    try {
      await removeMembership(this.endpoint, membership.sys.id);
      notification.info(message);
      this.setState({ usersList: without(usersList, membership) });
    } catch (e) {
      notification.error(e.message);
    }
  }

  render() {
    const { usersList, membershipsResource } = this.state;

    if (!this.state.usersList.length) return null;

    return (
      <Workbench testId="organization-users-page">
        <Workbench.Header>
          <Workbench.Title>Organization users</Workbench.Title>
          <div className="workbench-header__actions">
            <Button icon="PlusCircle" href={this.getLinkToInvitation()}>
              Invite users
            </Button>
          </div>
        </Workbench.Header>
        <Workbench.Content>
          <section style={{ padding: '1em 2em 2em' }}>
            <p align="right">
              There are {pluralize('users', membershipsResource.usage, true)} in this organization
            </p>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Organization role</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {usersList.map(membership => (
                  <TableRow key={membership.sys.id} onClick={() => this.goToUser(membership)}>
                    <TableCell>
                      {membership.user.firstName && (
                        <img
                          style={{ verticalAlign: 'middle', marginRight: '5px' }}
                          src={membership.user.avatarUrl}
                          width="32"
                          height="32"
                        />
                      )}
                      {membership.user.firstName ? (
                        `${membership.user.firstName} ${membership.user.lastName}`
                      ) : (
                        <Pill label="Invited" />
                      )}
                    </TableCell>
                    <TableCell>{membership.user.email}</TableCell>
                    <TableCell>{startCase(membership.role)}</TableCell>
                    <TableCell align="right">
                      <UserDropdown
                        membership={membership}
                        onMembershipRemove={() => this.handleMembershipRemove(membership)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default ServicesConsumer('notification')(UsersList);
