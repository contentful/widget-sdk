import { fetchAll, fetchAllWithIncludes } from 'data/CMA/FetchAll';
import { uniq, identity, chunk, flatten } from 'lodash';
import { PENDING_ORG_MEMBERSHIP, getAlphaHeader } from 'alphaHeaders.js';

const BATCH_LIMIT = 100;
const USER_IDS_BATCH_LIMIT = 44;
const INVITATION_ALPHA_HEADER = getAlphaHeader(PENDING_ORG_MEMBERSHIP);

/**
 * Get all organization memberships (not users) in the organization
 * @param {endpoint} endpoint organization endpoint
 */
export function getAllMemberships(endpoint, params) {
  return fetchAll(endpoint, ['organization_memberships'], BATCH_LIMIT, params);
}

export function getAllMembershipsWithQuery(endpoint, query) {
  return fetchAllWithIncludes(endpoint, ['organization_memberships'], BATCH_LIMIT, query);
}

export function getMemberships(endpoint, query) {
  return endpoint({
    method: 'GET',
    path: ['organization_memberships'],
    query,
  });
}

export function getMembership(endpoint, membershipId) {
  return endpoint({
    method: 'GET',
    path: ['organization_memberships', membershipId],
  });
}

export function removeMembership(endpoint, membershipId) {
  return endpoint({
    method: 'DELETE',
    path: ['organization_memberships', membershipId],
  });
}

// TODO: This should be in its own repository, because this deals with invitations and
// not organization_memberships
export function removeInvitation(endpoint, invitationId) {
  return endpoint({
    method: 'DELETE',
    path: ['invitations', invitationId],
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
    query,
  });
}

export function getUser(endpoint, userId) {
  return endpoint({
    method: 'GET',
    path: ['users', userId],
  });
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
  return Promise.all(batches.map((ids) => getUsers(endpoint, { 'sys.id': ids.join(',') })))
    .then((responces) => responces.map(({ items }) => items))
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
    query: params,
  });
}

export function getAllSpaces(endpoint, params) {
  return fetchAll(endpoint, ['spaces'], BATCH_LIMIT, params);
}

export function getRoles(endpoint, query) {
  return endpoint({
    method: 'GET',
    path: ['roles'],
    query,
  });
}

export async function getAllRoles(endpoint, params) {
  const roles = await fetchAllWithIncludes(endpoint, ['roles'], BATCH_LIMIT, params);
  return roles.items;
}

export function getInvitations(endpoint, query) {
  return endpoint({
    method: 'GET',
    path: ['invitations'],
    query,
  });
}

export function getInvitation(endpoint, invitationId, query) {
  return endpoint({
    method: 'GET',
    path: ['invitations', invitationId],
    query,
  });
}

export function invite(endpoint, { role, email }) {
  return endpoint(
    {
      method: 'POST',
      data: {
        role,
        email,
      },
      path: ['invitations'],
    },
    INVITATION_ALPHA_HEADER
  );
}

export function createOrgMembership(endpoint, { role, email, suppressInvitation }) {
  return endpoint({
    method: 'POST',
    data: {
      role,
      email,
      suppressInvitation,
    },
    path: ['organization_memberships'],
  });
}

export function updateMembership(endpoint, { id, role, version }) {
  return endpoint({
    method: 'PUT',
    data: {
      role,
    },
    version,
    path: ['organization_memberships', id],
  });
}

export function getSpaceMemberships(endpoint, query) {
  return endpoint({
    method: 'GET',
    query,
    path: ['space_memberships'],
  });
}

export function getAllSpaceMemberships(endpoint, query) {
  return fetchAllWithIncludes(endpoint, ['space_memberships'], BATCH_LIMIT, query);
}
