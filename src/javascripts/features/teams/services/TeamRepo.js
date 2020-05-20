import { fetchAllWithIncludes } from 'data/CMA/FetchAll';
import ResolveLinks from 'data/LinkResolver';

const BATCH_LIMIT = 100;

/**
 * Get all teams in the organization by id
 * @param {endpoint} endpoint organization endpoint
 * @param {object?} params
 */
export function getAllTeams(endpoint, params) {
  return fetchAllWithIncludes(endpoint, ['teams'], BATCH_LIMIT, params);
}

/**
 * Get all team memberships in the team
 * @param {endpoint} endpoint organization endpoint
 * @param {teamId} teamId team id
 */
export async function getAllTeamMemberships(endpoint, teamId) {
  const includePaths = ['sys.user', 'sys.createdBy'];
  const { items, includes } = await fetchAllWithIncludes(
    endpoint,
    ['teams', teamId, 'team_memberships'],
    BATCH_LIMIT,
    { include: includePaths.join(',') }
  );
  return ResolveLinks({ paths: includePaths, items, includes });
}

/**
 * Get all team space memberships in the team
 * @param {endpoint} endpoint organization endpoint
 * @param {teamId} teamId team id
 */
export async function getAllTeamSpaceMemberships(endpoint) {
  const includePaths = ['roles', 'sys.team', 'sys.space'];
  const { items, includes } = await fetchAllWithIncludes(
    endpoint,
    ['team_space_memberships'],
    BATCH_LIMIT,
    { include: includePaths.join(',') }
  );
  return ResolveLinks({ paths: includePaths, items, includes });
}

/**
 * Get team in the organization by id
 * @param {endpoint} endpoint organization endpoint
 * @param {teamId} teamId team id
 */
export function getTeam(endpoint, teamId) {
  return endpoint({
    method: 'GET',
    path: ['teams', teamId],
  });
}

/**
 * Create team in the organization
 * @param {endpoint} endpoint organization endpoint
 * @param {string} params.name new team name
 * @param {string} params.description new team description
 */
export function createTeam(endpoint, { name, description }) {
  return endpoint({
    method: 'POST',
    path: ['teams'],
    data: { name, description },
  });
}

/**
 * Update team in the organization
 * @param {endpoint} endpoint organization endpoint
 * @param {string} params.name new team name
 * @param {string} params.description new team description
 * @param {string} params.sys team sys
 */
export function updateTeam(endpoint, { name, description, sys }) {
  return endpoint({
    method: 'PUT',
    path: ['teams', sys.id],
    data: { name, description },
    version: sys.version,
  });
}

/**
 * Remove team from the organization by id
 * @param {endpoint} endpoint organization endpoint
 * @param {teamId} teamId team id
 */
export function removeTeam(endpoint, teamId) {
  return endpoint({
    method: 'DELETE',
    path: ['teams', teamId],
  });
}

/**
 * Create new team membership
 * @param {endpoint} endpoint organization endpoint
 * @param {teamId} teamId team id
 * @param {organizationMembershipId} organizationMembershipId organization membership id
 */
export async function createTeamMembership(
  endpoint,
  teamId,
  organizationMembershipId,
  admin = false
) {
  return endpoint({
    method: 'POST',
    path: ['teams', teamId, 'team_memberships'],
    data: { admin, organizationMembershipId },
  });
}

/**
 * Remove team membership
 * @param {endpoint} endpoint organization endpoint
 * @param {teamId} teamId team id
 */
export function removeTeamMembership(endpoint, teamId, teamMembershipId) {
  return endpoint({
    method: 'DELETE',
    path: ['teams', teamId, 'team_memberships', teamMembershipId],
  });
}
