import APIClient from 'data/APIClient';
import { createSpaceEndpoint } from 'data/EndpointFactory';

export function createAPIClient(spaceId, envId, source?: string) {
  return new APIClient(createSpaceEndpoint(spaceId, envId, source), source);
}
