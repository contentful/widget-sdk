import { fetchAll } from 'data/CMA/FetchAll';
const BATCH_LIMIT = 100;

/**
 * Get all teams in the organization by id
 * @param {endpoint} endpoint organization endpoint
 * @param {object?} params
 */
export function getAllTeams(endpoint, params) {
  return fetchAll(endpoint, ['teams'], BATCH_LIMIT, params);
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
