import {createOrganizationEndpoint} from 'data/Endpoint';
import * as auth from 'Authentication';
import {apiUrl, mockApiUrl} from 'Config';

export function createEndpoint (orgId) {
  return createOrganizationEndpoint(apiUrl(), orgId, auth);
}

export function createMockEndpoint (orgId) {
  return createOrganizationEndpoint(mockApiUrl(), orgId, auth);
}

export function getAll (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['organization_memberships']
  });
}

export function invite (endpoint, {role, email, suppressInvitation}) {
  return endpoint({
    method: 'POST',
    data: {
      role,
      email,
      suppressInvitation
    },
    path: ['organization_memberships']
  });
}

export function getSubscription (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['subscription']
  });
}
