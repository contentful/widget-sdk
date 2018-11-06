import { orgRoles } from '../UserDetail/OrgRoles.es6';
import { uniqBy, without } from 'lodash';

/**
 * This module contains the definitions of the filters available in the (org) User list page.
 * Each filter represents a key-value property that will be sent to the organization_memberships
 * API endpoint as a query string params
 */

export function getFilterDefinitions({ spaceRoles = [], spaces = [], hasSsoEnabled }) {
  const order = {
    id: 'sort',
    label: 'Sort by',
    filter: {
      key: 'order',
      value: '-sys.createdAt'
    },
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
    filter: {
      key: 'role',
      value: ''
    },
    options: [
      { label: 'Any', value: '' },
      ...orgRoles.map(({ name, value }) => ({ label: name, value }))
    ]
  };

  const sso = {
    id: 'ssoLogin',
    label: 'SSO',
    filter: {
      key: 'sys.sso.lastSignInAt',
      operator: 'exists',
      value: ''
    },
    options: [
      { label: 'Any', value: '' },
      { label: 'Has logged in', value: 'true' },
      { label: 'Never logged in', value: 'false' }
    ]
  };

  const spaceRole = {
    id: 'spaceRole',
    label: 'Space role',
    filter: {
      key: 'sys.spaceMemberships.roles.name',
      value: ''
    },
    options: [
      { label: 'Any', value: '' },
      { label: 'Admin', value: 'true' },
      // Get all the roles form all spaces, reduced by unique
      // names and sorted alphabetically
      ...uniqBy(spaceRoles, 'name')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(role => ({ label: role.name, value: role.name }))
    ]
  };

  const space = {
    id: 'space',
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
  };

  // removes the SSO filter if SSO is not available for the org
  return without([order, orgRole, sso, space, spaceRole], hasSsoEnabled ? null : sso);
}
