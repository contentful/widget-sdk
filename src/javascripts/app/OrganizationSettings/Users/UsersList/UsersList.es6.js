import React from 'react';
import PropTypes from 'prop-types';
import { Space as SpacePropType } from '../PropTypes.es6';
import { startCase, without, debounce, flow } from 'lodash';
import { set, isEqual } from 'lodash/fp';
import pluralize from 'pluralize';
import classnames from 'classnames';
import { connect } from 'react-redux';
import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Button,
  TextInput,
  Icon,
  Spinner
} from '@contentful/ui-component-library';
import { formatQuery } from './QueryBuilder.es6';
import ResolveLinks from '../../LinkResolver.es6';
import Workbench from 'app/common/Workbench.es6';
import UserListFilters from './UserListFilters.es6';
import UserCard from '../UserCard.es6';
import Pagination from 'app/common/Pagination.es6';
import { href } from 'states/Navigator.es6';
import {
  getMemberships,
  removeMembership
} from 'access_control/OrganizationMembershipRepository.es6';
import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import RemoveOrgMemberDialog from '../RemoveUserDialog.es6';
import EmptyPlaceholder from './EmptyPlaceholder.es6';
import { getFilters, getSearchTerm } from 'selectors/filters.es6';
import { getLastActivityDate } from '../UserUtils.es6';

const ServicesConsumer = require('../../../../reactServiceContext').default;

import { getFilterDefinitions } from './FilterDefinitions.es6';
import { Filter as FilterPropType } from '../PropTypes.es6';

const mergeFilterDefinitionsWithValues = (definitions, values) =>
  definitions.map(definition => {
    const definitionKey = definition.filter.key;
    if (definitionKey in values) {
      return set(['filter', 'value'], values[definitionKey], definition);
    }
    if (
      definitionKey === 'sys.spaceMemberships.roles.name' &&
      'sys.spaceMemberships.admin' in values
    ) {
      return set(['filter', 'value'], 'Admin', definition);
    }
    return definition;
  });

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
    filters: PropTypes.arrayOf(FilterPropType),
    searchTerm: PropTypes.string.isRequired,
    updateSearchTerm: PropTypes.func.isRequired,
    hasSsoEnabled: PropTypes.bool
  };

  state = {
    loading: false,
    queryTotal: 0,
    usersList: [],
    pagination: {
      skip: 0,
      limit: 10
    }
  };

  endpoint = createOrganizationEndpoint(this.props.orgId);

  componentDidMount() {
    this.fetch();
  }

  componentDidUpdate(prevProps) {
    if (
      !isEqual(prevProps.filters, this.props.filters) ||
      prevProps.searchTerm !== this.props.searchTerm
    ) {
      this.fetch();
    }
  }

  componentWillUnmount() {
    this.fetch.cancel();
  }

  fetch = debounce(async () => {
    const { filters, searchTerm } = this.props;
    const { pagination } = this.state;
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
  }, 500);

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
  static getLinkToUser(user) {
    return href({
      path: ['account', 'organizations', 'users', 'detail'],
      params: { userId: user.sys.id }
    });
  }

  handleMembershipRemove = membership => async () => {
    const { notification } = this.props.$services;
    const { usersList } = this.state;
    const user = membership.sys.user;
    const message = user.firstName
      ? `${user.firstName} has been successfully removed from this organization`
      : `Membership successfully removed`;

    const confirmation = await ModalLauncher.open(({ isShown, onClose }) => (
      <RemoveOrgMemberDialog isShown={isShown} onClose={onClose} user={user} />
    ));

    if (!confirmation) {
      return;
    }

    try {
      await removeMembership(this.endpoint, membership.sys.id);
      notification.success(message);
      this.setState({ usersList: without(usersList, membership) });
    } catch (e) {
      notification.error(e.data.message);
    }
  };

  handlePaginationChange = ({ skip, limit }) => {
    this.setState({ pagination: { ...this.state.pagination, skip, limit } }, this.fetch);
  };

  render() {
    const { queryTotal, usersList, pagination, loading } = this.state;
    const { resource, spaces, spaceRoles, filters } = this.props;

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
              spaces={spaces}
              spaceRoles={spaceRoles}
              filters={filters}
            />
            {usersList.length > 0 ? (
              <React.Fragment>
                <Table
                  data-test-id="organization-membership-list"
                  extraClassNames={classnames('organization-membership-list', {
                    'organization-membership-list--loading': loading
                  })}>
                  {loading ? (
                    <Spinner size="large" extraClassNames="organization-users-page__spinner" />
                  ) : null}
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
                          <a href={this.getLinkToUser(membership)}>
                            <UserCard user={membership.sys.user} />
                          </a>
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
              </React.Fragment>
            ) : (
              <EmptyPlaceholder loading={loading} />
            )}
          </section>
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default flow(
  connect(
    (state, { spaceRoles, spaces, hasSsoEnabled }) => {
      const filterDefinitions = getFilterDefinitions({ spaceRoles, spaces, hasSsoEnabled });
      const filterValues = getFilters(state);

      return {
        filters: mergeFilterDefinitionsWithValues(filterDefinitions, filterValues),
        searchTerm: getSearchTerm(state)
      };
    },
    dispatch => ({
      updateSearchTerm: e =>
        dispatch({ type: 'UPDATE_SEARCH_TERM', payload: { newSearchTerm: e.target.value } })
    })
  ),
  ServicesConsumer('notification')
)(UsersList);
