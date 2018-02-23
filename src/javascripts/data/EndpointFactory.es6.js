import * as Endpoint from 'data/Endpoint';
import * as auth from 'Authentication';
import {apiUrl} from 'Config';

export function createOrganizationEndpoint (orgId) {
  return Endpoint.createOrganizationEndpoint(apiUrl(), orgId, auth);
}

export function createSpaceEndpoint (spaceId, envId) {
  return Endpoint.createSpaceEndpoint(apiUrl(), spaceId, auth, envId);
}
