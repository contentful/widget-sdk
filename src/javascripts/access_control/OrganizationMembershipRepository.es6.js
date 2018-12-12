import { fetchAll, fetchAllWithIncludes } from 'data/CMA/FetchAll.es6';
import { uniq, identity, chunk, flatten } from 'lodash';

const BATCH_LIMIT = 100;
const USER_IDS_BATCH_LIMIT = 44;
const ALPHA_HEADER = {
  'x-contentful-enable-alpha-feature': 'organization-user-management-api'
};

/**
 * Get all organization memberships (not users) in the organization
 * @param {endpoint} endpoint organization endpoint
 */
export function getAllMemberships(endpoint) {
  return fetchAll(endpoint, ['organization_memberships'], BATCH_LIMIT, null, ALPHA_HEADER);
}

export function getAllMembershipsWithQuery(endpoint, query) {
  return fetchAllWithIncludes(
    endpoint,
    ['organization_memberships'],
    BATCH_LIMIT,
    query,
    ALPHA_HEADER
  );
}

export function getMemberships(endpoint, query) {
  return endpoint(
    {
      method: 'GET',
      path: ['organization_memberships'],
      query
    },
    ALPHA_HEADER
  );
}

export function getMembership(endpoint, membershipId) {
  return endpoint(
    {
      method: 'GET',
      path: ['organization_memberships', membershipId]
    },
    ALPHA_HEADER
  );
}

export function removeMembership(endpoint, membershipId) {
  return endpoint(
    {
      method: 'DELETE',
      path: ['organization_memberships', membershipId]
    },
    ALPHA_HEADER
  );
}

// TODO: This should be in its own repository, because this deals with invitations and
// not organization_memberships
export function removeInvitation(endpoint, invitationId) {
  return endpoint({
    method: 'DELETE',
    path: ['invitations', invitationId]
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

export function getUser(endpoint, userId) {
  return endpoint(
    {
      method: 'GET',
      path: ['users', userId]
    },
    ALPHA_HEADER
  );
}

export function getAllUsers(endpoint, params) {
  return fetchAll(endpoint, ['users'], BATCH_LIMIT, params);
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

export function getInvitations(endpoint, query) {
  return endpoint({
    method: 'GET',
    path: ['invitations'],
    query
  });
}

export function getInvitation(endpoint, invitationId, query) {
  return endpoint({
    method: 'GET',
    path: ['invitations', invitationId],
    query
  });
}

export function invite(endpoint, { role, email, spaceInvitations }) {
  return endpoint({
    method: 'POST',
    data: {
      role,
      email,
      spaceInvitations
    },
    path: ['invitations']
  });
}

export function createOrgMembership(endpoint, { role, email, suppressInvitation }) {
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

export function updateMembership(endpoint, { id, role, version }) {
  return endpoint(
    {
      method: 'PUT',
      data: {
        role
      },
      version,
      path: ['organization_memberships', id]
    },
    ALPHA_HEADER
  );
}

export function getSpaceMemberships(endpoint, query) {
  return endpoint(
    {
      method: 'GET',
      query,
      path: ['space_memberships']
    },
    ALPHA_HEADER
  );
}
