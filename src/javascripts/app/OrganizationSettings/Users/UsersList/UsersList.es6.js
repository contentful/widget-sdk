import React from 'react';
import PropTypes from 'prop-types';
import { startCase, debounce, flow } from 'lodash';
import { isEqual } from 'lodash/fp';
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
  Spinner,
  Notification,
  TextLink
} from '@contentful/forma-36-react-components';
import { formatQuery } from './QueryBuilder.es6';
import ResolveLinks from 'data/LinkResolver.es6';
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
import Placeholder from 'app/common/Placeholder.es6';
import { getFilters, getSearchTerm } from 'redux/selectors/filters.es6';
import getOrgId from 'redux/selectors/getOrgId.es6';
import {
  getInvitedUsersCount,
  membershipExistsParam
} from 'app/OrganizationSettings/UserInvitations/UserInvitationUtils.es6';

import { getLastActivityDate } from '../UserUtils.es6';
import { generateFilterDefinitions } from './FilterDefinitions.es6';
import {
  Filter as FilterPropType,
  Space as SpacePropType
} from 'app/OrganizationSettings/PropTypes.es6';

class UsersList extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    spaceRoles: PropTypes.array,
    spaces: PropTypes.arrayOf(SpacePropType),
    filters: PropTypes.arrayOf(FilterPropType),
    searchTerm: PropTypes.string.isRequired,
    updateSearchTerm: PropTypes.func.isRequired,
    hasSsoEnabled: PropTypes.bool
  };

  state = {
    loading: false,
    initialLoad: true,
    queryTotal: 0,
    usersList: [],
    pagination: {
      skip: 0,
      limit: 10
    },
    numberOrgMemberships: 0
  };

  endpoint = createOrganizationEndpoint(this.props.orgId);

  async componentDidMount() {
    await this.loadInitialData();
    this.setState({ initialLoad: false });
  }

  componentDidUpdate(prevProps) {
    if (
      !isEqual(prevProps.filters, this.props.filters) ||
      prevProps.searchTerm !== this.props.searchTerm
    ) {
      // the current page might be empty after filtering, going to the first page is our best bet
      this.setState({ pagination: { ...this.state.pagination, skip: 0 } }, this.fetch);
    }
  }

  loadInitialData = async () => {
    this.setState({ loading: true });

    await this.loadInvitationsCount();
    await this.fetch(true);

    this.setState({ loading: false });
  };

  loadInvitationsCount = async () => {
    const { orgId } = this.props;
    const count = await getInvitedUsersCount(orgId);

    this.setState({
      invitedUsersCount: count
    });
  };

  fetch = async (updateCount = false) => {
    const { filters, searchTerm, orgId } = this.props;
    const { pagination } = this.state;
    const filterQuery = formatQuery(filters.map(item => item.filter));
    const includePaths = ['sys.user'];
    const query = {
      ...filterQuery,
      query: searchTerm,
      include: includePaths,
      skip: pagination.skip,
      limit: pagination.limit,
      [membershipExistsParam]: true
    };

    this.setState({ loading: true });

    const { total, items, includes } = await getMemberships(this.endpoint, query);
    const resolved = ResolveLinks({ paths: includePaths, items, includes });

    const newState = {
      usersList: resolved,
      queryTotal: total,
      loading: false
    };

    if (updateCount) {
      const endpoint = createOrganizationEndpoint(orgId);
      newState.numberOrgMemberships = await getMemberships(endpoint, {
        [membershipExistsParam]: true
      }).then(({ total }) => total);
    }

    this.setState(newState);
  };

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
      params: {
        userId: user.sys.id
      }
    });
  }

  getLinkToInvitationsList() {
    return href({
      path: ['account', 'organizations', 'users', 'invitations'],
      params: { orgId: this.props.orgId }
    });
  }

  handleMembershipRemove = membership => async () => {
    const { usersList, pagination } = this.state;
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
      Notification.success(message);
      // last item in page removed
      if (usersList.length === 1 && pagination.skip > 0) {
        this.setState({ pagination: { ...pagination, skip: pagination.skip - pagination.limit } });
      }
      await this.fetch(true);
    } catch (e) {
      Notification.error(e.data.message);
    }
  };

  handlePaginationChange = ({ skip, limit }) => {
    this.setState({ pagination: { ...this.state.pagination, skip, limit } }, () => this.fetch());
  };

  search = e => {
    const newSearchTerm = e.target.value;

    this.debouncedSearch(newSearchTerm);
  };

  debouncedSearch = debounce(newSearchTerm => {
    const { updateSearchTerm } = this.props;

    updateSearchTerm(newSearchTerm);
  }, 500);

  render() {
    const {
      queryTotal,
      usersList,
      pagination,
      loading,
      invitedUsersCount,
      numberOrgMemberships,
      initialLoad
    } = this.state;
    const { searchTerm, spaces, spaceRoles, filters } = this.props;

    return (
      <Workbench testId="organization-users-page">
        <Workbench.Header>
          <Workbench.Header.Left>
            <Workbench.Icon icon="page-users" />
            <Workbench.Title>Users</Workbench.Title>
          </Workbench.Header.Left>
          <Workbench.Header.Search>
            <TextInput
              autoFocus
              type="search"
              placeholder="Search by first name, last name, email or user ID"
              onChange={this.search}
              value={searchTerm}
            />
          </Workbench.Header.Search>
          <Workbench.Header.Actions>
            <div>
              <div>{`${pluralize('users', numberOrgMemberships, true)} in your organization`}</div>
              {invitedUsersCount != null && invitedUsersCount > 0 && (
                <TextLink href={this.getLinkToInvitationsList()}>
                  {invitedUsersCount} invited users
                </TextLink>
              )}
            </div>
            <Button href={this.getLinkToInvitation()}>Invite users</Button>
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
            {initialLoad || queryTotal > 0 ? (
              <div style={{ position: 'relative' }}>
                {loading ? (
                  <Spinner size="large" className="organization-users-page__spinner" />
                ) : null}
                <Table
                  data-test-id="organization-membership-list"
                  className={classnames('organization-membership-list', {
                    'organization-membership-list--loading': loading
                  })}>
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
                              className="membership-list__item__menu__button">
                              Remove
                            </Button>
                            <Button
                              buttonType="muted"
                              size="small"
                              href={this.getLinkToUser(membership)}
                              className="membership-list__item__menu__button">
                              Edit
                            </Button>
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
              </div>
            ) : (
              <Placeholder
                loading={loading}
                title="No users found 🧐"
                text="Check your spelling or try changing the filters"
              />
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
      const filterValues = getFilters(state);
      const filterDefinitions = generateFilterDefinitions({
        spaceRoles,
        spaces,
        hasSsoEnabled,
        filterValues
      });

      return {
        filters: filterDefinitions,
        searchTerm: getSearchTerm(state),
        orgId: getOrgId(state)
      };
    },
    dispatch => ({
      updateSearchTerm: newSearchTerm =>
        dispatch({ type: 'UPDATE_SEARCH_TERM', payload: { newSearchTerm } })
    })
  )
)(UsersList);
