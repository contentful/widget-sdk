import { get } from 'lodash';

import { fetchAllWithIncludes } from 'data/CMA/FetchAll';
import ResolveLinks from 'data/LinkResolver';

const BATCH_LIMIT = 100;

/**
 * Get all teams in the organization
 * @param {endpoint} endpoint organization endpoint
 */
export async function getAllTeams(endpoint) {
  return (await fetchAllWithIncludes(endpoint, ['teams'], BATCH_LIMIT, {})).items;
}

export async function getAllTeamsSpaceMemberships(orgEndpoint) {
  const includePaths = ['roles', 'sys.team', 'sys.space'];
  const { items, includes } = await fetchAllWithIncludes(
    orgEndpoint,
    ['team_space_memberships'],
    BATCH_LIMIT,
    { include: includePaths.join(',') }
  );
  return ResolveLinks({ paths: includePaths, items, includes });
}

export async function getTeamsSpaceMembershipsOfSpace(spaceEndpoint) {
  const includePaths = ['roles', 'sys.team'];
  const { items, includes } = await fetchAllWithIncludes(
    spaceEndpoint,
    ['team_space_memberships'],
    BATCH_LIMIT,
    { include: includePaths.join(',') }
  );
  return ResolveLinks({ paths: includePaths, items, includes });
}

export async function getAllTeamMemberships(orgEndpoint, params = {}) {
  return fetchAllWithIncludes(orgEndpoint, ['team_memberships'], BATCH_LIMIT, params);
}

export function removeTeamMembership(orgEndpoint, membership) {
  return orgEndpoint({
    method: 'DELETE',
    path: ['teams', membership.sys.team.sys.id, 'team_memberships', membership.sys.id],
  });
}

export async function updateTeamSpaceMembership(spaceEndpoint, membership, admin, roles) {
  return spaceEndpoint(
    {
      method: 'PUT',
      path: ['team_space_memberships', get(membership, 'sys.id')],
      data: { admin, roles },
      version: get(membership, 'sys.version'),
    },
    { 'x-contentful-team': get(membership, 'sys.team.sys.id') }
  );
}

export async function deleteTeamSpaceMembership(spaceEndpoint, membership) {
  return spaceEndpoint(
    {
      method: 'DELETE',
      path: ['team_space_memberships', get(membership, 'sys.id')],
      version: get(membership, 'sys.version'),
    },
    { 'x-contentful-team': get(membership, 'sys.team.sys.id') }
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
      data,
    },
    {
      'x-contentful-team': teamId,
    }
  );
}

export function createTeamMembership(endpoint, organizationMembershipId, teamId) {
  return endpoint({
    method: 'POST',
    path: ['teams', teamId, 'team_memberships'],
    data: { organizationMembershipId, admin: false },
  });
}
