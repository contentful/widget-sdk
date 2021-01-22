import { OrganizationEndpoint, CollectionResponse } from './types/Generic';
import { withAlphaHeader } from './utils';

/**
 * Add product rate plan given by `productRatePlanId` to the organization's subscription.
 *
 * @param {OrganizationEndpoint} endpoint
 * @param {string}               productRatePlanId
 */
export async function addProductRatePlanToSubscription(
  endpoint: OrganizationEndpoint,
  productRatePlanId: string
) {
  const response = await withAlphaHeader(endpoint)({
    method: 'POST',
    path: ['plans'],
    data: {
      productRatePlanId,
    },
  });

  return response;
}

/**
 * Get all rate plans of planType `space` for the organization's subscription.
 *
 * @param {OrganizationEndpoint} endpoint
 */
export async function getSpaceRatePlans(endpoint: OrganizationEndpoint) {
  // TODO(jo-sm): Add type for SpaceRatePlan
  const data = await withAlphaHeader<CollectionResponse<unknown>>(endpoint)({
    method: 'GET',
    path: ['plans'],
    query: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      plan_type: 'space',
    },
  });

  return data.items;
}
