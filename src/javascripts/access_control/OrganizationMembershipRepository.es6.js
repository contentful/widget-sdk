import { fetchAll } from 'data/CMA/FetchAll.es6';
import { uniq, identity, chunk, flatten } from 'lodash';

const BATCH_LIMIT = 100;
const USER_IDS_BATCH_LIMIT = 44;

export function getAll(endpoint) {
  return endpoint({
    method: 'GET',
    path: ['organization_memberships']
  });
}

/**
 * Get organization's users from endpoint
 * @param {function} endpoint - organization endpoint
 * @param {object?} query
 */
export function getUsers(endpoint, query) {
  return endpoint({
    method: 'GET',
    path: ['users'],
    query
  });
}

/**
 * Get organization's users with given ids from endpoint
 * @param {function} endpoint - organization endpoint
 * @param {Array<string>} params.userIds - array of user ids
 * @returns {Array<object>}
 */
export function getUsersByIds(endpoint, userIds) {
  // Split into batches because of query string limitation of 1024 chars
  const batches = chunk(uniq(userIds).filter(identity), USER_IDS_BATCH_LIMIT);
  return Promise.all(batches.map(ids => getUsers(endpoint, { 'sys.id': ids.join(',') })))
    .then(responces => responces.map(({ items }) => items))
    .then(flatten);
}

/**
 * Get all spaces of the organization
 * Opposed to the TokenStore that only lists the spaces that the current user is part of,
 * this enpoint will bring all spaces of the organization.
 */
export function getSpaces(endpoint, params) {
  return endpoint({
    method: 'GET',
    path: ['spaces'],
    query: params
  });
}

export function getAllSpaces(endpoint, params) {
  return fetchAll(endpoint, ['spaces'], BATCH_LIMIT, params);
}

export function getRoles(endpoint, query) {
  return endpoint({
    method: 'GET',
    path: ['roles'],
    query
  });
}

export function getAllRoles(endpoint, params) {
  return fetchAll(endpoint, ['roles'], BATCH_LIMIT, params);
}

export function invite(endpoint, { role, email, suppressInvitation }) {
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
