import { createOrganizationEndpoint } from 'data/EndpointFactory.es6';
import { getMemberships } from 'access_control/OrganizationMembershipRepository.es6';
import { fetchAll } from 'data/CMA/FetchAll.es6';
import ResolveLinks from '../LinkResolver.es6';

const includePaths = ['sys.user'];

export function getInvitedUsers(orgId) {
  const endpoint = createOrganizationEndpoint(orgId);

  return Promise.all([
    fetchAll(endpoint, ['invitations'], 100, { 'status[eq]': 'pending' }),
    getMemberships(endpoint, { include: includePaths, 'sys.user.firstName[eq]': '' }).then(
      ({ items, includes }) => ResolveLinks({ paths: includePaths, items, includes })
    )
  ]).then(([invitations, pendingMemberships]) => {
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
  });
}

export function getInvitedUsersCount(orgId) {
  const endpoint = createOrganizationEndpoint(orgId);

  return Promise.all([
    fetchAll(endpoint, ['invitations'], 100, { 'status[eq]': 'pending', limit: 0 }).then(
      ({ total }) => total
    ),
    getMemberships(endpoint, { include: includePaths, 'sys.user.firstName[eq]': '' }).then(
      ({ total }) => total
    )
  ]).then(([invitationCount, pendingOrgMembershipCount]) => {
    return invitationCount + pendingOrgMembershipCount;
  });
}
