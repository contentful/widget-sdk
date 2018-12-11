import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import {
  getAllMembershipsWithQuery,
  getInvitations,
  getMemberships
} from 'access_control/OrganizationMembershipRepository.es6';
import { fetchAll } from 'data/CMA/FetchAll.es6';
import ResolveLinks from '../LinkResolver.es6';

const includePaths = ['sys.user'];
export const membershipExistsParam = 'sys.user.firstName[exists]';

export async function getInvitedUsers(orgId) {
  const endpoint = createOrganizationEndpoint(orgId);

  const [invitations, pendingMemberships] = await Promise.all([
    fetchAll(endpoint, ['invitations'], 100, { 'status[eq]': 'pending' }),
    getAllMembershipsWithQuery(endpoint, {
      include: includePaths,
      [membershipExistsParam]: false
    }).then(({ items, includes }) => {
      return ResolveLinks({ paths: includePaths, items, includes });
    })
  ]);

  return invitations
    .map(({ email, role, sys: { id, createdAt } }) => ({
      id,
      createdAt,
      email,
      role,
      type: 'invitation'
    }))
    .concat(
      pendingMemberships.map(({ role, sys: { id, createdAt, user: { email } } }) => ({
        id,
        createdAt,
        email,
        role,
        type: 'organizationMembership'
      }))
    );
}

export async function getInvitedUsersCount(orgId) {
  const endpoint = createOrganizationEndpoint(orgId);

  const [invitationCount, pendingOrgMembershipCount] = await Promise.all([
    getInvitations(endpoint, { 'status[eq]': 'pending', limit: 0 }).then(({ total }) => total),
    getMemberships(endpoint, { [membershipExistsParam]: false, limit: 0 }).then(
      ({ total }) => total
    )
  ]);

  return invitationCount + pendingOrgMembershipCount;
}
