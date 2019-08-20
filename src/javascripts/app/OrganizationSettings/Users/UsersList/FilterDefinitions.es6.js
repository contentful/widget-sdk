import { orgRoles } from 'utils/MembershipUtils.es6';
import { without, set, cloneDeep } from 'lodash';
import {
  getRoleOptions,
  getSpaceRoleOptions,
  SPACE_ROLE_FILTER_KEYS
} from './UserListFiltersHelpers.es6';

/**
 * This module contains the definitions of the filters available in the (org) User list page.
 * Each filter represents a key-value property that will be sent to the organization_memberships
 * API endpoint as a query string params
 */

const idMap = {
  sort: ['order'],
  orgRole: ['role'],
  space: ['sys.spaceMemberships.sys.space.sys.id'],
  ssoLogin: ['sys.sso.lastSignInAt'],
  spaceRole: SPACE_ROLE_FILTER_KEYS,
  team: ['sys.teamMemberships.sys.team.sys.id']
};

const defaultFiltersById = {
  sort: {
    key: 'order',
    value: '-sys.createdAt'
  },
  orgRole: {
    key: 'role',
    value: ''
  },
  ssoLogin: {
    key: 'sys.sso.lastSignInAt',
    operator: 'exists',
    value: ''
  },
  space: {
    key: 'sys.spaceMemberships.sys.space.sys.id',
    value: ''
  },
  spaceRole: {
    key: 'sys.spaceMemberships.roles.name',
    value: ''
  },
  team: {
    key: 'sys.teamMemberships.sys.team.sys.id',
    value: ''
  }
};

/*
  Normalizes an object that has a filterKey: filterValue mapping and
  normalizes it to the id of the filter definition.

  E.g.

  {
    'sys.spaceMemberships.sys.space.sys.id': 'space_1234'
  }

  becomes

  {
    space: {
      key: 'sys.spaceMemberships.sys.space.sys.id',
      value: 'space_1234'
    }
  }
 */
const normalizeFilterValues = filterValues => {
  return filterValues.reduce((memo, [key, value]) => {
    const [id] = Object.entries(idMap).find(([_, filterKeys]) => filterKeys.includes(key)) || [];

    if (id) {
      set(memo, [id, 'key'], key);
      set(memo, [id, 'value'], value);
    }

    return memo;
  }, cloneDeep(defaultFiltersById));
};

export function generateFilterDefinitions({
  spaceRoles = [],
  spaces = [],
  teams = [],
  hasSsoEnabled,
  filterValues = {}
}) {
  const normalized = normalizeFilterValues(Object.entries(filterValues));

  const order = {
    id: 'sort',
    label: 'Sort by',
    filter: normalized.sort,
    options: [
      { label: 'Newest', value: '-sys.createdAt' },
      { label: 'Oldest', value: 'sys.createdAt' },
      { label: 'First name A → Z', value: 'sys.user.firstName' },
      { label: 'First name Z → A', value: '-sys.user.firstName' },
      { label: 'Last name A → Z', value: 'sys.user.lastName' },
      { label: 'Last name Z → A', value: '-sys.user.lastName' },
      { label: 'Active recently', value: '-sys.lastActiveAt' },
      { label: 'Active least recently', value: 'sys.lastActiveAt' }
    ]
  };

  const orgRole = {
    id: 'orgRole',
    label: 'Organization role',
    filter: normalized.orgRole,
    options: [
      { label: 'Any', value: '' },
      ...orgRoles.map(({ name, value }) => ({ label: name, value }))
    ]
  };

  const sso = {
    id: 'ssoLogin',
    label: 'SSO',
    filter: normalized.ssoLogin,
    options: [
      { label: 'Any', value: '' },
      { label: 'Has logged in', value: 'true' },
      { label: 'Never logged in', value: 'false' }
    ]
  };

  const space = {
    id: 'space',
    label: 'Space',
    filter: normalized.space,
    options: [
      { label: 'Any', value: '' },
      ...spaces
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(space => ({ label: space.name, value: space.sys.id }))
    ]
  };

  const spaceFilterValue = space.filter.value;
  const spaceRole = {
    id: 'spaceRole',
    label: 'Space role',
    filter: normalized.spaceRole,
    options: spaceFilterValue
      ? getSpaceRoleOptions(spaceRoles, spaceFilterValue)
      : getRoleOptions(spaceRoles)
  };

  const team = {
    id: 'team',
    label: 'Team',
    filter: normalized.team,
    options: [
      { label: 'Any', value: '' },
      ...teams
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(team => ({ label: team.name, value: team.sys.id }))
    ]
  };

  // removes the SSO filter if SSO is not available for the org
  return without([order, orgRole, sso, space, spaceRole, team], hasSsoEnabled ? null : sso);
}
