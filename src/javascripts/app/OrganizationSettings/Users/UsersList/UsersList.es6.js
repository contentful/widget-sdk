import React from 'react';
import PropTypes from 'prop-types';
import { Space as SpacePropType } from '../PropTypes.es6';
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
import { formatQuery } from './QueryBuilder.es6';
import ResolveLinks from '../../LinkResolver.es6';
import Workbench from 'ui/Components/Workbench/JSX.es6';
import UserDropdown from './UserDropdown.es6';
import UserListFilters from './UserListFilters.es6';
import { href, go } from 'states/Navigator.es6';
import {
  getMemberships,
  removeMembership
} from 'access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getFilterDefinitions } from './FilterDefinitions.es6';

const ServicesConsumer = require('../../../../reactServiceContext').default;

class UsersList extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      notification: PropTypes.object
    }),
    orgId: PropTypes.string.isRequired,
    spaceRoles: PropTypes.array,
    spaces: PropTypes.arrayOf(SpacePropType),
    resource: PropTypes.shape({
      usage: PropTypes.number,
      limits: PropTypes.shape({
        maximum: PropTypes.number
      })
    })
  };

  state = {
    queryTotal: 0,
    usersList: [],
    filters: getFilterDefinitions(this.props.spaces, this.props.spaceRoles)
  };

  endpoint = createOrganizationEndpoint(this.props.orgId);

  componentDidMount() {
    this.fetch();
  }

  async fetch() {
    const { filters } = this.state;
    const filterQuery = formatQuery(filters.map(item => item.filter));
    const includePaths = ['sys.user'];
    const query = {
      ...filterQuery,
      include: includePaths
    };
    const { total, items, includes } = await getMemberships(this.endpoint, query);
    const resolved = ResolveLinks({ paths: includePaths, items, includes });

    this.setState({
      usersList: resolved,
      queryTotal: total
    });
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
    const { firstName } = membership.sys.user;
    const message = firstName
      ? `${firstName} has been successfully removed from this organization`
      : `Membership successfully removed`;

    try {
      await removeMembership(this.endpoint, membership.sys.id);
      notification.info(message);
      this.setState({ usersList: without(usersList, membership) });
    } catch (e) {
      notification.error(e.data.message);
    }
  }

  updateFilters = filters => {
    this.setState({ filters }, this.fetch);
  };

  resetFilters = () => {
    const filters = getFilterDefinitions(this.props.spaces, this.props.spaceRoles);
    this.updateFilters(filters);
  };

  render() {
    const { queryTotal, usersList, filters } = this.state;
    const { resource } = this.props;

    return (
      <Workbench testId="organization-users-page">
        <Workbench.Header>
          <Workbench.Title>Organization users</Workbench.Title>
          <div className="workbench-header__actions">
            {`${pluralize('users', resource.usage, true)} in your organization`}
            <Button icon="PlusCircle" href={this.getLinkToInvitation()}>
              Invite users
            </Button>
          </div>
        </Workbench.Header>
        <Workbench.Content>
          <section style={{ padding: '1em 2em 2em' }}>
            <UserListFilters
              queryTotal={queryTotal}
              onChange={this.updateFilters}
              filters={filters}
              onReset={this.resetFilters}
            />
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
                      {membership.sys.user.firstName && (
                        <img
                          style={{ verticalAlign: 'middle', marginRight: '5px' }}
                          src={membership.sys.user.avatarUrl}
                          width="32"
                          height="32"
                        />
                      )}
                      {membership.sys.user.firstName ? (
                        `${membership.sys.user.firstName} ${membership.sys.user.lastName}`
                      ) : (
                        <Pill label="Invited" />
                      )}
                    </TableCell>
                    <TableCell>{membership.sys.user.email}</TableCell>
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
