import React, { useCallback, useReducer, useEffect, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { debounce, times } from 'lodash';
import { css } from 'emotion';
import classnames from 'classnames';
import {
  Button,
  Notification,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextInput,
  Tooltip,
  Workbench,
  SkeletonContainer,
  SkeletonBodyText,
  SkeletonImage,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import StateLink from 'app/common/StateLink';
import { formatQuery, formatFilterValues } from './QueryBuilder';
import ResolveLinks from 'data/LinkResolver';
import { UserListFilters } from './UserListFilters';
import Pagination from 'app/common/Pagination';
import {
  getMemberships,
  reinvite,
  removeMembership,
} from 'access_control/OrganizationMembershipRepository';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import RemoveOrgMemberDialog from '../RemoveUserDialog';
import Placeholder from 'app/common/Placeholder';
import { UserListRow } from './UserListRow';
import {
  defaultFilterValues,
  generateFilterDefinitions,
  getFilterValuesFromQuery,
  getSearchTermFromQuery,
} from './FilterDefinitions';
import { Space as SpacePropType, Team as TeamPropType } from 'app/OrganizationSettings/PropTypes';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { useAsyncFn } from 'core/hooks';
import { createImmerReducer } from 'core/utils/createImmerReducer';
import { UserLimitBanner } from './UserLimitBanner';
import { LocationStateContext, LocationDispatchContext } from 'core/services/LocationContext';
import qs from 'qs';

const styles = {
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
  list: css({ position: 'relative' }),
  col15: css({
    width: '15%',
  }),
  colActions: css({
    width: '200px',
  }),
};

UsersList.propTypes = {
  orgId: PropTypes.string.isRequired,
  spaceRoles: PropTypes.array,
  teams: PropTypes.arrayOf(TeamPropType),
  spaces: PropTypes.arrayOf(SpacePropType),
  hasSsoEnabled: PropTypes.bool,
  hasTeamsFeature: PropTypes.bool,
};

const reducer = createImmerReducer({
  USERS_FETCHED: (state, action) => {
    state.users = action.payload;
  },
  USER_REMOVED: (state, action) => {
    state.users.items = state.users.items.filter((user) => user.sys.id !== action.payload.sys.id);
  },
  PAGINATION_CHANGED: (state, action) => {
    state.pagination = action.payload;
  },
});

export function UsersList({ orgId, spaceRoles, teams, spaces, hasSsoEnabled, hasTeamsFeature }) {
  const updateLocation = useContext(LocationDispatchContext);
  const locationValue = useContext(LocationStateContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState(defaultFilterValues);

  const filters = generateFilterDefinitions({
    spaceRoles,
    spaces,
    teams,
    hasSsoEnabled,
    hasTeamsFeature,
    filterValues,
  });

  const initialState = {
    users: { items: [], queryTotal: 0 },
    pagination: {
      skip: 0,
      limit: 10,
    },
  };

  const [{ users, pagination }, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const queryValues = locationValue.search ? qs.parse(locationValue.search.slice(1)) : {};
    setFilterValues(getFilterValuesFromQuery(queryValues));
    setSearchTerm(getSearchTermFromQuery(queryValues));
    dispatch({
      type: 'PAGINATION_CHANGED',
      payload: {
        skip: 0,
        limit: 10,
      },
    });
  }, [locationValue, dispatch]);

  const fetchUsers = useCallback(async () => {
    const orgEndpoint = createOrganizationEndpoint(orgId);
    const includePaths = ['sys.user'];
    const filterQuery = formatFilterValues(filterValues);
    const query = {
      ...filterQuery,
      query: searchTerm,
      include: includePaths,
      skip: pagination.skip,
      limit: pagination.limit,
    };
    const { total, items, includes } = await getMemberships(orgEndpoint, query);
    const resolved = ResolveLinks({ paths: includePaths, items, includes });
    dispatch({ type: 'USERS_FETCHED', payload: { items: resolved, queryTotal: total } });
    return { items: resolved, queryTotal: total };
  }, [orgId, filterValues, searchTerm, pagination, dispatch]);

  const [{ isLoading: isLoadingUsers }, updateUsers] = useAsyncFn(fetchUsers);

  useEffect(() => {
    updateUsers();
  }, [updateUsers]);

  const getLinkToInvitation = () => {
    return {
      path: ['account', 'organizations', 'users', 'new'],
      params: { orgId },
    };
  };

  const handleFiltersChanged = (newFilters) => {
    let newFilterValues = formatQuery(newFilters.map((item) => item.filter));
    if (searchTerm !== '') {
      newFilterValues = { ...newFilterValues, searchTerm: searchTerm };
    }
    updateLocation(newFilterValues);
  };

  const handleFiltersReset = () => {
    updateLocation({});
  };

  const debouncedSearch = useCallback(
    debounce((newSearchTerm, currentFilters) => {
      let newQuery = currentFilters;
      if (newSearchTerm !== '') {
        newQuery = { ...newQuery, searchTerm: newSearchTerm };
      }
      updateLocation(newQuery);
    }, 500),
    []
  );

  const search = (e) => {
    const newSearchTerm = e.target.value;
    debouncedSearch(newSearchTerm, filterValues);
  };

  const handleMembershipRemove = (membership) => async () => {
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
      await removeMembership(createOrganizationEndpoint(orgId), membership.sys.id);
      dispatch({ type: 'USER_REMOVED', payload: membership });
      Notification.success(message);
      // last item in page removed
      if (users.items.length === 1 && pagination.skip > 0) {
        dispatch({
          type: 'PAGINATION_CHANGED',
          payload: {
            ...pagination,
            skip: pagination.skip - pagination.limit,
          },
        });
      }
    } catch (e) {
      Notification.error(e.data.message);
    }
  };

  const handlePaginationChange = ({ skip, limit }) => {
    dispatch({
      type: 'PAGINATION_CHANGED',
      payload: {
        skip,
        limit,
      },
    });
  };

  return (
    <Workbench testId="organization-users-page">
      <Workbench.Header
        icon={<ProductIcon icon="Users" size="large" />}
        title="Users"
        actions={
          <div className={styles.actionsWrapper}>
            <TextInput
              className={styles.search}
              autoFocus
              type="search"
              placeholder="Search by first name, last name, email or user ID"
              onChange={search}
              value={searchTerm}
            />
            <div className={styles.ctaWrapper}>
              <StateLink component={Button} {...getLinkToInvitation()}>
                Invite users
              </StateLink>
            </div>
          </div>
        }
      />
      <Workbench.Content>
        <UserLimitBanner orgId={orgId} spaces={spaces} />
        <section>
          <UserListFilters
            queryTotal={users.queryTotal}
            spaceRoles={spaceRoles}
            filters={filters}
            onChange={handleFiltersChanged}
            onReset={handleFiltersReset}
          />
          {isLoadingUsers || users.queryTotal > 0 ? (
            <div className={styles.list}>
              <Table
                data-test-id="organization-membership-list"
                className={classnames('organization-membership-list', {
                  'organization-membership-list--loading': isLoadingUsers,
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
                  {isLoadingUsers ? (
                    <LoadingState numberOfRows={pagination.limit} />
                  ) : (
                    users.items.map((membership) => (
                      <UserListRow
                        key={membership.sys.id}
                        membership={membership}
                        onMembershipRemove={handleMembershipRemove}
                        onReinvite={() => reinvite(membership)}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
              <Pagination
                {...pagination}
                total={users.queryTotal}
                loading={isLoadingUsers}
                onChange={handlePaginationChange}
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
