import { fetchAll, fetchAllWithIncludes } from 'data/CMA/FetchAll.es6';
import ResolveLinks from '../data/LinkResolver.es6';

const ALPHA_HEADER = { 'x-contentful-enable-alpha-feature': 'teams-api' };
const BATCH_LIMIT = 100;

/**
 * Get all teams in the organization
 * @param {endpoint} endpoint organization endpoint
 */
export function getAllTeams(endpoint, params) {
  return fetchAll(endpoint, ['teams'], BATCH_LIMIT, params, ALPHA_HEADER);
}

export async function getAllTeamsSpaceMemberships(endpoint) {
  const includePaths = ['roles', 'sys.team'];
  const { items, includes } = await fetchAllWithIncludes(
    endpoint,
    ['team_space_memberships'],
    BATCH_LIMIT,
    { include: includePaths.join(',') },
    ALPHA_HEADER
  );
  return ResolveLinks({ paths: includePaths, items, includes });
}

export async function getAllTeamsMemberships(endpoint) {
  const { items } = await fetchAllWithIncludes(
    endpoint,
    ['team_memberships'],
    BATCH_LIMIT,
    {},
    ALPHA_HEADER
  );
  return items;
}
