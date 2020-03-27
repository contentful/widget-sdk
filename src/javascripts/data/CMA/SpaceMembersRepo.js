import { TEAMS_API, getAlphaHeader } from 'alphaHeaders.js';
import { fetchAll, fetchAllWithIncludes } from './FetchAll';

const alphaHeader = getAlphaHeader(TEAMS_API);

export default function create(endpoint) {
  return {
    get() {
      return endpoint(
        {
          method: 'GET',
          path: ['space_members'],
        },
        alphaHeader
      );
    },

    getAll() {
      return fetchAll(endpoint, ['space_members'], 100, {}, alphaHeader);
    },
  };
}

/**
 * Space Member (not to be confused with Space Membership) is the relationship
 * between a user and a space.
 * It's a read-only entity that represents access a user has to a space through
 * Team Space Memberships and Space Membership.
 * Its shape is almost identical to a Space Membership, with the exception that
 * it links to all related memberships.
 * Space Members are useful when one wants to know how a user got access to a given space.
 * Users can be given direct access to a space via a Space Membership or indirect access
 * via one or multiple Team Memberships.
 * {
 *    admin: boolean,
 *    roles: [SpaceRoleLink],
 *    relatedMemberships: [SpaceMembershipLink|TeamSpaceMembershipLinks]
 * }
 */
export function getAllUserSpaceMembersInOrg(endpoint, userId, query) {
  return fetchAllWithIncludes(
    endpoint,
    ['users', userId, 'space_members'],
    100,
    query,
    alphaHeader
  );
}
