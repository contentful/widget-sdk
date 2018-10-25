import React from 'react';
import PropTypes from 'prop-types';
import { Space as SpacePropType } from '../PropTypes.es6';
import { startCase, without, debounce } from 'lodash';
import pluralize from 'pluralize';
import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Pill,
  Button,
  TextInput,
  Icon
} from '@contentful/ui-component-library';
import { formatQuery } from './QueryBuilder.es6';
import ResolveLinks from '../../LinkResolver.es6';
import Workbench from 'ui/Components/Workbench/JSX.es6';
import UserListFilters from './UserListFilters.es6';
import UserCard from '../Common/UserCard.es6';
import { href } from 'states/Navigator.es6';
import {
  getMemberships,
  removeMembership
} from 'access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getFilterDefinitions } from './FilterDefinitions.es6';
import { getLastActivityDate } from '../Common/LastActivityDate.es6';

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
    }),
    hasSsoEnabled: PropTypes.bool
  };

  state = {
    queryTotal: 0,
    usersList: [],
    filters: this.getInitialFilters(),
    searchTerm: ''
  };

  endpoint = createOrganizationEndpoint(this.props.orgId);

  componentDidMount() {
    this.fetch();
  }

  async fetch() {
    const { filters, searchTerm } = this.state;
    const filterQuery = formatQuery(filters.map(item => item.filter));
    const includePaths = ['sys.user'];
    const query = {
      ...filterQuery,
      query: searchTerm,
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
  getLinkToUser(user) {
    return href({
      path: ['account', 'organizations', 'users', 'detail'],
      params: { userId: user.sys.id }
    });
  }

  handleMembershipRemove = membership => async () => {
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
  };

  updateFilters = filters => {
    this.setState({ filters }, this.fetch);
  };

  resetFilters = () => {
    const filters = this.getInitialFilters();
    this.updateFilters(filters);
  };

  getInitialFilters() {
    const { spaceRoles, spaces, hasSsoEnabled } = this.props;
    return getFilterDefinitions({ spaceRoles, spaces, hasSsoEnabled });
  }

  updateSearch = e => {
    this.debouncedUpdatedSearch(e.target.value);
  };

  debouncedUpdatedSearch = debounce(searchTerm => {
    this.setState({ searchTerm }, this.fetch);
  }, 500);

  render() {
    const { queryTotal, usersList, filters } = this.state;
    const { resource } = this.props;

    return (
      <Workbench testId="organization-users-page">
        <Workbench.Header>
          <Workbench.Header.Left>
            <Workbench.Title>Organization users</Workbench.Title>
          </Workbench.Header.Left>
          <Workbench.Header.Search>
            <TextInput
              autoFocus
              type="search"
              placeholder="Search by first name, last name, email or user ID"
              onChange={this.updateSearch}
            />
          </Workbench.Header.Search>
          <Workbench.Header.Actions>
            {`${pluralize('users', resource.usage, true)} in your organization`}
            <Button icon="PlusCircle" href={this.getLinkToInvitation()}>
              Invite users
            </Button>
          </Workbench.Header.Actions>
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
                  <TableCell width="50">User</TableCell>
                  <TableCell width="200">Organization role</TableCell>
                  <TableCell colSpan="2">Last active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersList.map(membership => (
                  <TableRow key={membership.sys.id} className="membership-list__item">
                    <TableCell>
                      {membership.sys.user.firstName ? (
                        <UserCard user={membership.sys.user} />
                      ) : (
                        <Pill label="Invited" />
                      )}
                    </TableCell>
                    <TableCell>{startCase(membership.role)}</TableCell>
                    <TableCell>{getLastActivityDate(membership)}</TableCell>
                    <TableCell align="right">
                      <div className="membership-list__item__menu">
                        <Button
                          buttonType="muted"
                          size="small"
                          onClick={this.handleMembershipRemove(membership)}
                          extraClassNames="membership-list__item__menu__button">
                          Remove
                        </Button>
                        <Button
                          buttonType="muted"
                          size="small"
                          href={this.getLinkToUser(membership)}
                          extraClassNames="membership-list__item__menu__button">
                          Edit
                        </Button>
                        <Icon
                          icon="MoreHorizontal"
                          extraClassNames="membership-list__item__menu__icon"
                        />
                      </div>
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
