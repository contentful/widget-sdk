import React from 'react';
import PropTypes from 'prop-types';
import { startCase, without, uniqBy } from 'lodash';
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
import { orgRoles } from '../UserDetail/OrgRoles.es6';
import { formatQuery } from './QueryBuilder.es6';
import ResolveLinks from '../../LinkResolver.es6';
import Workbench from 'ui/Components/Workbench/JSX.es6';
import UserDropdown from './UserDropdown.es6';
import SearchFilterList from './SearchFilterList.es6';
import createResourceService from 'services/ResourceService.es6';
import { href, go } from 'states/Navigator.es6';
import {
  getAllSpaces,
  getAllRoles,
  getMemberships,
  removeMembership
} from 'access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';

const ServicesConsumer = require('../../../../reactServiceContext').default;

const defaultFilters = [
  {
    label: 'Sort',
    filter: {
      key: 'order',
      value: 'sys.createdAt'
    },
    options: [
      { label: 'First name A → Z', value: 'sys.user.firstName' },
      { label: 'First name Z → A', value: '-sys.user.firstName' },
      { label: 'Last name A → Z', value: 'sys.user.lastName' },
      { label: 'Last name Z → A', value: '-sys.user.lastName' },
      { label: 'Created newest', value: 'sys.createdAt' },
      { label: 'Last activity newest', value: 'sys.lastActivityAt' },
      { label: 'Last activity oldest', value: '-sys.lastActivityAt' }
    ]
  },
  {
    label: 'Organization role',
    filter: {
      key: 'role',
      value: 'owner'
    },
    options: [
      { label: 'Any', value: '' },
      ...orgRoles.map(({ name, value }) => ({ label: name, value }))
    ]
  },
  {
    label: 'SSO status',
    filter: {
      key: 'sys.sso.lastSignedInAt',
      operator: 'exists',
      value: ''
    },
    options: [
      { label: 'Any', value: '' },
      { label: 'Active', value: 'true' },
      { label: 'Inactive', value: 'false' }
    ]
  }
];

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
    membershipsResource: null,
    filters: defaultFilters
  };

  endpoint = createOrganizationEndpoint(this.props.orgId);

  async componentDidMount() {
    const { orgId } = this.props;
    const resources = createResourceService(orgId, 'organization');
    const [_, membershipsResource, spaces, spaceRoles] = await Promise.all([
      this.fetch(),
      resources.get('organization_membership'),
      getAllSpaces(this.endpoint),
      getAllRoles(this.endpoint)
    ]);
    this.props.context.ready = true;
    this.setState({
      membershipsResource,
      filters: [
        ...defaultFilters,
        {
          label: 'Space role',
          filter: {
            key: 'sys.spaceMemberships.role.name',
            operator: 'eq',
            value: ''
          },
          options: [
            { label: 'Any', value: '' },
            ...uniqBy(spaceRoles, 'name')
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(role => ({ label: role.name, value: role.name }))
          ]
        },
        {
          label: 'Space',
          filter: {
            key: 'sys.spaceMemberships.sys.space.sys.id',
            value: ''
          },
          options: [
            { label: 'Any', value: '' },
            ...spaces
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(space => ({ label: space.name, value: space.sys.id }))
          ]
        }
      ]
    });
  }

  async fetch() {
    const { filters } = this.state;
    const filterQuery = formatQuery(filters.map(item => item.filter));
    const includePaths = ['sys.user'];
    const query = {
      ...filterQuery,
      include: includePaths
    };
    const { items, includes } = await getMemberships(this.endpoint, query);
    const resolved = ResolveLinks({ paths: includePaths, items, includes });

    this.setState({ usersList: resolved });
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

  render() {
    const { usersList, membershipsResource, filters } = this.state;

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
            <SearchFilterList onChange={this.updateFilters} filters={filters} />
            <p align="right">
              {membershipsResource &&
                `There are ${pluralize(
                  'users',
                  membershipsResource.usage,
                  true
                )} in this organization`}
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
