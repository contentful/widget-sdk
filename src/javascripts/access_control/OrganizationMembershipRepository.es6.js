import {createOrganizationEndpoint} from 'data/Endpoint';
import * as auth from 'Authentication';
import {apiUrl} from 'Config';
import {fetchAll} from 'data/CMA/FetchAll';

const BATCH_LIMIT = 100;

export function createEndpoint (orgId) {
  return createOrganizationEndpoint(apiUrl(), orgId, auth);
}

export function getAll (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['organization_memberships']
  });
}

/**
 * Get organization's users from endpoint
 * @param {function} endpoint - organization endpoint
 * @param {object?} query
 * @param {string|Number?} query.limit
 * @param {string?} query.user_ids - comma-separated list of user ids
 */
export function getUsers (endpoint, query) {
  return endpoint({
    method: 'GET',
    path: ['users'],
    query
  });
}

/**
 * Get all spaces of the organization
 * Opposed to the TokenStore that only lists the spaces that the current user is part of,
 * this enpoint will bring all spaces of the organization.
 */
export function getSpaces (endpoint, params) {
  return endpoint({
    method: 'GET',
    path: ['spaces'],
    query: params
  });
}

export function getAllSpaces (endpoint, params) {
  return fetchAll(endpoint, ['spaces'], BATCH_LIMIT, params);
}

export function getRoles (endpoint, query) {
  return endpoint({
    method: 'GET',
    path: ['roles'],
    query
  });
}

export function getAllRoles (endpoint, params) {
  return fetchAll(endpoint, ['roles'], BATCH_LIMIT, params);
}

export function invite (endpoint, {role, email, suppressInvitation}) {
  return endpoint({
    method: 'POST',
    data: {
      role,
      email,
      suppressInvitation
    },
    path: ['organization_memberships']
  });
}
