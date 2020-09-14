import APIClient from 'data/APIClient';
import { createSpaceEndpoint } from 'data/EndpointFactory';

export function createAPIClient(spaceId, envId) {
  return new APIClient(createSpaceEndpoint(spaceId, envId));
}
