import {
  AddOnProductRatePlan,
  ProductRatePlan,
  SpaceProductRatePlan,
} from './types/ProductRatePlan';
import { CollectionResponse } from './types/Generic';

import { withAlphaHeader } from './utils';
import { OrganizationEndpoint } from 'data/CMA/types';

/**
 * Gets all the product rate plans available to the organization.
 *
 * @param {OrganizationEndpoint} endpoint
 */
export async function getAllProductRatePlans(endpoint: OrganizationEndpoint) {
  const data = await withAlphaHeader<CollectionResponse<ProductRatePlan>>(endpoint)({
    method: 'GET',
    path: ['product_rate_plans'],
  });

  return data.items;
}

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
      plan_type: 'add-on',
    },
  });

  return data.items;
}

/**
 * Get product rate plans for organization that have a planType of `space`.
 *
 * If `spaceId` is provided, it will be passed along in the query and if the plan
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
    plan_type: 'space',
  };

  if (spaceId) {
    query.space_id = spaceId;
  }

  const data = await withAlphaHeader<CollectionResponse<SpaceProductRatePlan>>(endpoint)({
    method: 'GET',
    path: ['product_rate_plans'],
    query,
  });

  return data.items;
}
