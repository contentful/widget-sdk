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
import UserCard from '../UserCard.es6';
import Pagination from 'app/common/Pagination.es6';
import { href } from 'states/Navigator.es6';
import {
  getMemberships,
  removeMembership
} from 'access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getFilterDefinitions } from './FilterDefinitions.es6';
import { getLastActivityDate } from '../UserUtils.es6';

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
    loading: false,
    queryTotal: 0,
    usersList: [],
    filters: this.getInitialFilters(),
    searchTerm: '',
    pagination: {
      skip: 0,
      limit: 10
    }
  };

  endpoint = createOrganizationEndpoint(this.props.orgId);

  componentDidMount() {
    this.fetch();
  }

  async fetch() {
    const { filters, searchTerm, pagination } = this.state;
    const filterQuery = formatQuery(filters.map(item => item.filter));
    const includePaths = ['sys.user'];
    const query = {
      ...filterQuery,
      query: searchTerm,
      include: includePaths,
      skip: pagination.skip,
      limit: pagination.limit
    };

    this.setState({ loading: true });

    const { total, items, includes } = await getMemberships(this.endpoint, query);
    const resolved = ResolveLinks({ paths: includePaths, items, includes });

    this.setState({
      usersList: resolved,
      queryTotal: total,
      loading: false
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
    this.setState({ filters, pagination: { ...this.state.pagination, skip: 0 } }, this.fetch);
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
    this.setState({ searchTerm, pagination: { ...this.state.pagination, skip: 0 } }, this.fetch);
  }, 500);

  handlePaginationChange = ({ skip, limit }) => {
    this.setState({ pagination: { ...this.state.pagination, skip, limit } }, this.fetch);
  };

  render() {
    const { queryTotal, usersList, filters, pagination, loading } = this.state;
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
            <Table data-test-id="organization-membership-list">
              <TableHead>
                <TableRow>
                  <TableCell width="50">User</TableCell>
                  <TableCell width="200">Organization role</TableCell>
                  <TableCell colSpan="2">Last active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersList.map(membership => (
                  <TableRow
                    key={membership.sys.id}
                    className="membership-list__item"
                    data-test-id="organization-membership-list-row">
                    <TableCell>
                      {membership.sys.user.firstName ? (
                        <a href={this.getLinkToUser(membership)}>
                          <UserCard user={membership.sys.user} />
                        </a>
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

            <Pagination
              {...pagination}
              total={queryTotal}
              loading={loading}
              onChange={this.handlePaginationChange}
            />
          </section>
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default ServicesConsumer('notification')(UsersList);
