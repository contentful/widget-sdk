import React from 'react';
import PropTypes from 'prop-types';
import { startCase, debounce, times } from 'lodash';
import { css } from 'emotion';
import { isEqual } from 'lodash/fp';
import pluralize from 'pluralize';
import classnames from 'classnames';
import { connect } from 'react-redux';
import {
  Button,
  Notification,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextInput,
  TextLink,
  Tooltip,
  Workbench,
  SkeletonContainer,
  SkeletonBodyText,
  SkeletonImage
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import StateLink from 'app/common/StateLink';
import { formatQuery } from './QueryBuilder';
import ResolveLinks from 'data/LinkResolver';
import UserListFilters from './UserListFilters';
import UserCard from '../UserCard';
import Pagination from 'app/common/Pagination';
import { getMemberships, removeMembership } from 'access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import ModalLauncher from 'app/common/ModalLauncher';
import RemoveOrgMemberDialog from '../RemoveUserDialog';
import Placeholder from 'app/common/Placeholder';
import { getFilters, getSearchTerm } from 'redux/selectors/filters';
import getOrgId from 'redux/selectors/getOrgId';
import {
  getInvitedUsersCount,
  membershipExistsParam
} from 'app/OrganizationSettings/UserInvitations/UserInvitationUtils';

import { getLastActivityDate, get2FAStatus } from '../UserUtils';
import { generateFilterDefinitions } from './FilterDefinitions';
import {
  Filter as FilterPropType,
  Space as SpacePropType,
  Team as TeamPropType
} from 'app/OrganizationSettings/PropTypes';
import NavigationIcon from 'ui/Components/NavigationIcon';

const styles = {
  filters: css({
    padding: '1em 2em 2em'
  }),
  search: css({
    maxWidth: '1100px',
    marginLeft: 'auto',
    paddingLeft: tokens.spacingL
  }),
  ctaWrapper: css({
    paddingLeft: tokens.spacingM,
    marginLeft: 'auto',
    display: 'flex'
  }),
  numberOrgMemberships: css({
    marginRight: tokens.spacingXs
  }),
  actionsWrapper: css({
    width: '100%',
    display: 'flex'
  }),
  membershipLink: css({
    textDecoration: 'none',
    ':link': {
      textDecoration: 'none'
    }
  }),
  list: css({ position: 'relative' })
};

class UsersList extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    spaceRoles: PropTypes.array,
    teams: PropTypes.arrayOf(TeamPropType),
    spaces: PropTypes.arrayOf(SpacePropType),
    filters: PropTypes.arrayOf(FilterPropType),
    searchTerm: PropTypes.string.isRequired,
    updateSearchTerm: PropTypes.func.isRequired,
    hasSsoEnabled: PropTypes.bool,
    hasTeamsFeature: PropTypes.bool,
    hasPendingOrgMembershipsEnabled: PropTypes.bool
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
    const { hasPendingOrgMembershipsEnabled } = this.props;

    this.setState({ loading: true });

    // if this is undefined while the flag value is being fetched the list will show pending members for a second and then hide then
    // forcing it to check if the flag is bool false fix this
    if (hasPendingOrgMembershipsEnabled === false) {
      await this.loadInvitationsCount();
    }

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
    const { filters, searchTerm, orgId, hasPendingOrgMembershipsEnabled } = this.props;
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

    // in the legacy invitation flow we filter out users without name.
    // this won't be needed once pending org memberships are fully rolled out
    // if this is undefined while the flag value is being fetched the list will show pending members for a second and then hide then
    // forcing it to check if the flag is bool false fix this
    if (hasPendingOrgMembershipsEnabled === false) query[membershipExistsParam] = true;

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
    return {
      path: ['account', 'organizations', 'users', 'new'],
      params: { orgId: this.props.orgId }
    };
  }

  // TODO: temporarily using the membership id instead of the user id
  // as a route param.
  // This should be changed after `include` is implemented in the backend
  // so that we can get the linked membership from the user endpoint response
  getLinkToUser(user) {
    return {
      path: 'account.organizations.users.detail',
      params: {
        userId: user.sys.id
      }
    };
  }

  getLinkToInvitationsList() {
    return {
      path: 'account.organizations.users.invitations',
      params: { orgId: this.props.orgId }
    };
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
        this.setState({
          pagination: {
            ...pagination,
            skip: pagination.skip - pagination.limit
          }
        });
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

  renderLoadingState = () => {
    return times(5, idx => (
      <TableRow key={idx}>
        <TableCell>
          <SkeletonContainer svgHeight={42} clipId="user-avatar">
            <SkeletonImage width={32} height={32} radiusX="100%" radiusY="100%" />
            <SkeletonBodyText numberOfLines={2} offsetLeft={52} />
          </SkeletonContainer>
        </TableCell>
        <SkeletonCell clipId="role" />
        <SkeletonCell clipId="last-active" />
        <SkeletonCell clipId="2fa-status" />
        <TableCell />
      </TableRow>
    ));
  };

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
    const { searchTerm, spaces, spaceRoles, filters, hasPendingOrgMembershipsEnabled } = this.props;

    return (
      <Workbench testId="organization-users-page">
        <Workbench.Header
          icon={<NavigationIcon icon="users" size="large" color="green" />}
          title="Users"
          actions={
            <div className={styles.actionsWrapper}>
              <TextInput
                className={styles.search}
                autoFocus
                type="search"
                placeholder="Search by first name, last name, email or user ID"
                onChange={this.search}
                value={searchTerm}
              />
              <div className={styles.ctaWrapper}>
                {!hasPendingOrgMembershipsEnabled && (
                  <div className={styles.numberOrgMemberships}>
                    <div>{`${pluralize(
                      'users',
                      numberOrgMemberships,
                      true
                    )} in your organization`}</div>
                    {invitedUsersCount != null && invitedUsersCount > 0 && (
                      <StateLink component={TextLink} {...this.getLinkToInvitationsList()}>
                        {invitedUsersCount} invited users
                      </StateLink>
                    )}
                  </div>
                )}
                <StateLink component={Button} {...this.getLinkToInvitation()}>
                  Invite users
                </StateLink>
              </div>
            </div>
          }
        />
        <Workbench.Content>
          <section className={styles.filters}>
            <UserListFilters
              queryTotal={queryTotal}
              spaces={spaces}
              spaceRoles={spaceRoles}
              filters={filters}
            />
            {initialLoad || queryTotal > 0 ? (
              <div className={styles.list}>
                <Table
                  data-test-id="organization-membership-list"
                  className={classnames('organization-membership-list', {
                    'organization-membership-list--loading': loading
                  })}>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell width="200">Organization role</TableCell>
                      <TableCell>Last active</TableCell>
                      <TableCell>
                        <Tooltip content="2FA status will not be present for users who are ineligible or haven’t enabled it.">
                          2FA status
                        </Tooltip>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usersList.length === 0
                      ? this.renderLoadingState()
                      : usersList.map(membership => (
                          <TableRow
                            key={membership.sys.id}
                            className="membership-list__item"
                            data-test-id="organization-membership-list-row">
                            <TableCell>
                              <StateLink
                                component={TextLink}
                                {...this.getLinkToUser(membership)}
                                className={styles.membershipLink}>
                                <UserCard user={membership.sys.user} status={membership.status} />
                              </StateLink>
                            </TableCell>
                            <TableCell>{startCase(membership.role)}</TableCell>
                            <TableCell>{getLastActivityDate(membership)}</TableCell>
                            <TableCell>{get2FAStatus(membership)}</TableCell>
                            <TableCell align="right">
                              <div className="membership-list__item__menu">
                                <Button
                                  buttonType="muted"
                                  size="small"
                                  onClick={this.handleMembershipRemove(membership)}
                                  className="membership-list__item__menu__button">
                                  Remove
                                </Button>
                                <StateLink
                                  component={Button}
                                  buttonType="muted"
                                  size="small"
                                  href={this.getLinkToUser(membership)}
                                  className="membership-list__item__menu__button"
                                  {...this.getLinkToUser(membership)}>
                                  Edit
                                </StateLink>
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

function SkeletonCell({ clipId }) {
  return (
    <TableCell>
      <SkeletonContainer svgHeight={42} clipId={clipId}>
        <SkeletonBodyText numberOfLines={2} />
      </SkeletonContainer>
    </TableCell>
  );
}

SkeletonCell.propTypes = {
  clipId: PropTypes.string
};

export default connect(
  (
    state,
    { spaceRoles, spaces, teams, hasSsoEnabled, hasTeamsFeature, hasPendingOrgMembershipsEnabled }
  ) => {
    const filterValues = getFilters(state);
    const filterDefinitions = generateFilterDefinitions({
      spaceRoles,
      spaces,
      teams,
      hasSsoEnabled,
      hasPendingOrgMembershipsEnabled,
      hasTeamsFeature,
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
)(UsersList);
