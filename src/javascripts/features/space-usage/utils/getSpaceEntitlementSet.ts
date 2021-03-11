import { createSpaceEndpoint } from 'data/EndpointFactory';

export async function getSpaceEntitlementSet(spaceId) {
  const endpoint = createSpaceEndpoint(spaceId, 'master');

  return await endpoint({
    method: 'GET',
    path: ['space_entitlement_set'],
  });
}
