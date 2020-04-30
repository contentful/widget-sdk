import React from 'react';
import PropTypes from 'prop-types';
import { startCase, debounce, times } from 'lodash';
import { css } from 'emotion';
import { isEqual } from 'lodash/fp';
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
  SkeletonImage,
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
import { ModalLauncher } from 'core/components/ModalLauncher';
import RemoveOrgMemberDialog from '../RemoveUserDialog';
import Placeholder from 'app/common/Placeholder';
import { getFilters, getSearchTerm } from 'redux/selectors/filters';
import getOrgId from 'redux/selectors/getOrgId';
import { getLastActivityDate, get2FAStatus } from '../UserUtils';
import { generateFilterDefinitions } from './FilterDefinitions';
import {
  Filter as FilterPropType,
  Space as SpacePropType,
  Team as TeamPropType,
} from 'app/OrganizationSettings/PropTypes';
import NavigationIcon from 'ui/Components/NavigationIcon';

const styles = {
  filters: css({
    padding: '1em 2em 2em',
  }),
  search: css({
    maxWidth: '1100px',
    marginLeft: 'auto',
    paddingLeft: tokens.spacingL,
  }),
  ctaWrapper: css({
    paddingLeft: tokens.spacingM,
    marginLeft: 'auto',
    display: 'flex',
  }),
  actionsWrapper: css({
    width: '100%',
    display: 'flex',
  }),
  membershipLink: css({
    textDecoration: 'none',
    ':link': {
      textDecoration: 'none',
    },
  }),
  list: css({ position: 'relative' }),
  col15: css({
    width: '15%',
  }),
  colActions: css({
    width: '200px',
  }),
};

class UsersList extends React.Component {
  static propTypes = {
    initialLoad: PropTypes.bool,
    orgId: PropTypes.string.isRequired,
    spaceRoles: PropTypes.array,
    teams: PropTypes.arrayOf(TeamPropType),
    spaces: PropTypes.arrayOf(SpacePropType),
    filters: PropTypes.arrayOf(FilterPropType),
    searchTerm: PropTypes.string.isRequired,
    updateSearchTerm: PropTypes.func.isRequired,
    hasSsoEnabled: PropTypes.bool,
    hasTeamsFeature: PropTypes.bool,
  };

  state = {
    loading: true,
    queryTotal: 0,
    usersList: [],
    pagination: {
      skip: 0,
      limit: 10,
    },
  };

  endpoint = createOrganizationEndpoint(this.props.orgId);

  componentDidUpdate(prevProps) {
    // Call loadInitialData after UserListRoute has finished loading its initial data
    if (prevProps.initialLoad && !this.props.initialLoad) {
      this.loadInitialData();
    }

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
    await this.fetch();
    this.setState({ loading: false });
  };

  fetch = async () => {
    const { filters, searchTerm } = this.props;
    const { pagination } = this.state;
    const filterQuery = formatQuery(filters.map((item) => item.filter));
    const includePaths = ['sys.user'];
    const query = {
      ...filterQuery,
      query: searchTerm,
      include: includePaths,
      skip: pagination.skip,
      limit: pagination.limit,
    };

    this.setState({ loading: true });

    const { total, items, includes } = await getMemberships(this.endpoint, query);
    const resolved = ResolveLinks({ paths: includePaths, items, includes });

    const newState = {
      usersList: resolved,
      queryTotal: total,
      loading: false,
    };

    this.setState(newState);
  };

  getLinkToInvitation() {
    return {
      path: ['account', 'organizations', 'users', 'new'],
      params: { orgId: this.props.orgId },
    };
  }

  getLinkToUser(user) {
    return {
      path: 'account.organizations.users.detail',
      params: {
        userId: user.sys.id,
      },
    };
  }

  getLinkToInvitationsList() {
    return {
      path: 'account.organizations.users.invitations',
      params: { orgId: this.props.orgId },
    };
  }

  handleMembershipRemove = (membership) => async () => {
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
            skip: pagination.skip - pagination.limit,
          },
        });
      }
      await this.fetch();
    } catch (e) {
      Notification.error(e.data.message);
    }
  };

  handlePaginationChange = ({ skip, limit }) => {
    this.setState({ pagination: { ...this.state.pagination, skip, limit } }, () => this.fetch());
  };

  search = (e) => {
    const newSearchTerm = e.target.value;

    this.debouncedSearch(newSearchTerm);
  };

  debouncedSearch = debounce((newSearchTerm) => {
    const { updateSearchTerm } = this.props;

    updateSearchTerm(newSearchTerm);
  }, 500);

  render() {
    const { queryTotal, usersList, pagination, loading } = this.state;
    const { searchTerm, spaces, spaceRoles, filters } = this.props;

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
            {loading || queryTotal > 0 ? (
              <div className={styles.list}>
                <Table
                  data-test-id="organization-membership-list"
                  className={classnames('organization-membership-list', {
                    'organization-membership-list--loading': loading,
                  })}>
                  <colgroup>
                    <col />
                    <col className={styles.col15} />
                    <col className={styles.col15} />
                    <col className={styles.col15} />
                    <col className={styles.colActions} />
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Organization role</TableCell>
                      <TableCell>Last active</TableCell>
                      <TableCell>
                        <Tooltip content="2FA status will not be present for users who are ineligible or haven’t enabled it.">
                          2FA status
                        </Tooltip>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usersList.length === 0 ? (
                      <LoadingState numberOfRows={pagination.limit} />
                    ) : (
                      usersList.map((membership) => (
                        <TableRow
                          key={membership.sys.id}
                          className="membership-list__item"
                          data-test-id="organization-membership-list-row">
                          <TableCell>
                            <StateLink
                              component={TextLink}
                              {...this.getLinkToUser(membership)}
                              className={styles.membershipLink}>
                              <UserCard user={membership.sys.user} status={membership.sys.status} />
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
                      ))
                    )}
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

function SkeletonCell() {
  return (
    <TableCell>
      <SkeletonContainer svgHeight={42}>
        <SkeletonBodyText numberOfLines={2} />
      </SkeletonContainer>
    </TableCell>
  );
}

function LoadingState({ numberOfRows }) {
  return times(numberOfRows, (idx) => (
    <TableRow key={idx}>
      <TableCell>
        <SkeletonContainer svgHeight={42}>
          <SkeletonImage width={32} height={32} radiusX="100%" radiusY="100%" />
          <SkeletonBodyText numberOfLines={2} offsetLeft={52} />
        </SkeletonContainer>
      </TableCell>
      <SkeletonCell />
      <SkeletonCell />
      <SkeletonCell />
      <TableCell />
    </TableRow>
  ));
}

LoadingState.propTypes = {
  numberOfRows: PropTypes.number.isRequired,
};

export default connect(
  (state, { spaceRoles, spaces, teams, hasSsoEnabled, hasTeamsFeature }) => {
    const filterValues = getFilters(state);
    const filterDefinitions = generateFilterDefinitions({
      spaceRoles,
      spaces,
      teams,
      hasSsoEnabled,
      hasTeamsFeature,
      filterValues,
    });

    return {
      filters: filterDefinitions,
      searchTerm: getSearchTerm(state),
      orgId: getOrgId(state),
    };
  },
  (dispatch) => ({
    updateSearchTerm: (newSearchTerm) =>
      dispatch({ type: 'UPDATE_SEARCH_TERM', payload: { newSearchTerm } }),
  })
)(UsersList);
