import { fetchAllWithIncludes } from 'data/CMA/FetchAll.es6';
import ResolveLinks from '../data/LinkResolver.es6';

const ALPHA_HEADER = { 'x-contentful-enable-alpha-feature': 'teams-api' };
const BATCH_LIMIT = 100;

/**
 * Get all teams in the organization
 * @param {endpoint} endpoint organization endpoint
 */
export async function getAllTeams(endpoint) {
  return (await fetchAllWithIncludes(endpoint, ['teams'], BATCH_LIMIT, {}, ALPHA_HEADER)).items;
}

export async function getAllTeamsSpaceMemberships(orgEndpoint) {
  const includePaths = ['roles', 'sys.team'];
  const { items, includes } = await fetchAllWithIncludes(
    orgEndpoint,
    ['team_space_memberships'],
    BATCH_LIMIT,
    { include: includePaths.join(',') },
    ALPHA_HEADER
  );
  return ResolveLinks({ paths: includePaths, items, includes });
}

export async function getTeamsSpaceMembershipsOfSpace(spaceEndpoint) {
  const includePaths = ['roles', 'sys.team'];
  const { items, includes } = await fetchAllWithIncludes(
    spaceEndpoint,
    ['team_space_memberships'],
    BATCH_LIMIT,
    { include: includePaths.join(',') },
    ALPHA_HEADER
  );
  return ResolveLinks({ paths: includePaths, items, includes });
}

export async function getAllTeamsMemberships(orgEndpoint) {
  const { items } = await fetchAllWithIncludes(
    orgEndpoint,
    ['team_memberships'],
    BATCH_LIMIT,
    {},
    ALPHA_HEADER
  );
  return items;
}

export async function updateTeamSpaceMembership(
  spaceEndpoint,
  {
    sys: {
      version,
      id,
      team: {
        sys: { id: teamId }
      }
    }
  },
  admin,
  roles
) {
  return spaceEndpoint(
    {
      method: 'PUT',
      path: ['team_space_memberships', id],
      data: { admin, roles },
      version: version
    },
    { ...ALPHA_HEADER, 'x-contentful-team': teamId }
  );
}

export async function createTeamSpaceMembership(spaceEndpoint, teamId, { admin, roles }) {
  let data;

  if (admin) {
    data = { admin: true };
  } else {
    data = { roles };
  }

  return spaceEndpoint(
    {
      method: 'POST',
      path: ['team_space_memberships'],
      data
    },
    {
      'x-contentful-team': teamId,
      ...ALPHA_HEADER
    }
  );
}
