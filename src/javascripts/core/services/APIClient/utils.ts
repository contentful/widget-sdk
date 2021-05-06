import APIClient from 'data/APIClient';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { Source } from 'i13n/constants';

export function createAPIClient(spaceId, envId, source?: Source) {
  return new APIClient(createSpaceEndpoint(spaceId, envId, source));
}
