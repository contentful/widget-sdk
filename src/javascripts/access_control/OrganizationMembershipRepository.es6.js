import {createOrganizationEndpoint} from 'data/Endpoint';
import * as auth from 'Authentication';
import {apiUrl} from 'Config';

export function createEndpoint (orgId) {
  return createOrganizationEndpoint(apiUrl(), orgId, auth);
}

export function getAll (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['organization_memberships']
  });
}

export function invite (endpoint, {role, email, supressInvitation}) {
  return endpoint({
    method: 'POST',
    data: {
      role,
      email,
      supressInvitation
    },
    path: ['organization_memberships']
  });
}
