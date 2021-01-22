import { SpaceProductRatePlan, AddOnProductRatePlan } from './types/ProductRatePlan';
import { OrganizationEndpoint, CollectionResponse } from './types/Generic';

import { withAlphaHeader } from './utils';

/**
 * Get all product rate plans that have a plan type of `add_on`.
 *
 * @param {OrganizationEndpoint} endpoint
 */
export async function getAddOnProductRatePlans(endpoint: OrganizationEndpoint) {
  const data = await withAlphaHeader<CollectionResponse<AddOnProductRatePlan>>(endpoint)({
    method: 'GET',
    path: ['product_rate_plans'],
    query: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      plan_type: 'add-on',
    },
  });

  return data.items;
}

/**
 * Get product rate plans for organization that have a planType of `space`.
 *
 * If `spaceId` is provided, it will be passed along in the query and if that rate plan
 * for that space matches one of the product rate plans, that product rate plan will
 * have an unavailability reason with type `currentPlan`.
 *
 * @param {OrganizationEndpoint} endpoint
 * @param {string}               spaceId
 */
export async function getSpaceProductRatePlans(endpoint: OrganizationEndpoint, spaceId?: string) {
  interface Query {
    plan_type: 'space';
    space_id?: string;
  }

  const query: Query = {
    // eslint-disable-next-line @typescript-eslint/camelcase
    plan_type: 'space',
  };

  if (spaceId) {
    // eslint-disable-next-line @typescript-eslint/camelcase
    query.space_id = spaceId;
  }

  const data = await withAlphaHeader<CollectionResponse<SpaceProductRatePlan>>(endpoint)({
    method: 'GET',
    path: ['product_rate_plans'],
    query,
  });

  return data.items;
}
