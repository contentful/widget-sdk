import * as EndpointFactory from 'data/EndpointFactory.es6';
import { createMockEndpoint } from './JobsMockEndpoint.es6';

/**
 * Module created to provide mock implementation of the schedule endpoints
 * to allow development of the widget w/o existing endpoint in the api.
 */
export function createSpaceEndpoint(spaceId, environmentId) {
  const spaceEndpoint = EndpointFactory.createSpaceEndpoint(spaceId, environmentId);

  return createMockEndpoint(spaceEndpoint);
}
