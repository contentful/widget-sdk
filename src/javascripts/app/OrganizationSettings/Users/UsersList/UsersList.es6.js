import React from 'react';
import PropTypes from 'prop-types';
import Workbench from 'ui/Components/Workbench/JSX.es6';
import { Table, TableRow, TableHead, TableBody, TableCell } from '@contentful/ui-component-library';
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
    usersList: []
  };

  async componentDidMount() {
    const endpoint = createOrganizationEndpoint(this.props.orgId);
    const [users, memberships] = await Promise.all([
      getAllUsers(endpoint),
      getAllMemberships(endpoint)
    ]);

    const usersList = memberships.map(membership => ({
      ...membership,
      user: users.find(user => user.sys.id === membership.user.sys.id)
    }));

    this.props.context.ready = true;
    this.setState({ usersList });
  }

  render() {
    const { usersList } = this.state;

    if (!this.state.usersList.length) return '';

    return (
      <Workbench title="Organization users" testId="organization-users-page">
        <Workbench.Content>
          <Table style={{ padding: '1em 2em 2em' }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Organization role</TableCell>
                <TableCell>Last activity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersList.map(membership => (
                <TableRow key={membership.sys.id}>
                  <TableCell>{membership.user.firstName}</TableCell>
                  <TableCell>{membership.user.email}</TableCell>
                  <TableCell>{membership.role}</TableCell>
                  <TableCell>July 27, 2019</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Workbench.Content>
      </Workbench>
    );
  }
}
