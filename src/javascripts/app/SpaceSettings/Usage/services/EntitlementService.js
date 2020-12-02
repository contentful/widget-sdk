import { createSpaceEndpoint } from 'data/EndpointFactory';

const resourceToEntitlementMapping = {
  asset: 'records',
  entry: 'records',
  record: 'records',
  content_type: 'contentTypes',
  environment: 'environments',
  locale: 'locales',
  role: 'roles',
};

export function getEntitlementByResourceKey(resourceKey, entitlementsSet) {
  const entitlementKey = resourceToEntitlementMapping[resourceKey];

  return entitlementsSet.quotas[entitlementKey]?.value;
}

export async function getSpaceEntitlementSet(spaceId) {
  const endpoint = createSpaceEndpoint(spaceId);

  return await endpoint({
    method: 'GET',
    path: ['space_entitlement_set'],
  });
}
