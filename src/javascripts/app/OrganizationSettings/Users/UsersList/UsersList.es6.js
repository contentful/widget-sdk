import React from 'react';
import PropTypes from 'prop-types';
import { startCase } from 'lodash';
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
import createResourceService from 'services/ResourceService.es6';
import { href } from 'states/Navigator.es6';
import {
  getAllUsers,
  getAllMemberships
} from 'access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

export default class UsersList extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    context: PropTypes.any
  };

  state = {
    usersList: [],
    membershipsResource: null
  };

  async componentDidMount() {
    const { orgId } = this.props;
    const endpoint = createOrganizationEndpoint(orgId);
    const resources = createResourceService(orgId, 'organization');
    const [users, memberships, membershipsResource] = await Promise.all([
      getAllUsers(endpoint),
      getAllMemberships(endpoint),
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
                </TableRow>
              </TableHead>
              <TableBody>
                {usersList.map(membership => (
                  <TableRow key={membership.sys.id}>
                    <TableCell>
                      {membership.user.firstName && (
                        <img
                          style={{ verticalAlign: 'middle', marginRight: '5px' }}
                          src={membership.user.avatarUrl}
                          width="32"
                          height="32"
                        />
                      )}
                      {membership.user.firstName || <Pill label="Invited" />}
                    </TableCell>
                    <TableCell>{membership.user.email}</TableCell>
                    <TableCell>{startCase(membership.role)}</TableCell>
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
