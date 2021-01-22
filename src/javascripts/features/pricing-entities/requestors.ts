import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { ProductRatePlan } from './types';
import { SUBSCRIPTIONS_API, getAlphaHeader } from 'alphaHeaders.js';

interface CollectionResponse<T> {
  sys: {
    type: 'Array';
  };
  total: number;
  items: T[];
}

type OrganizationEndpoint = ReturnType<typeof createOrganizationEndpoint>;

const alphaHeader = getAlphaHeader(SUBSCRIPTIONS_API);

/**
 * Get all product rate plans that have a plan type of `add_on`.
 *
 * @param {OrganizationEndpoint} endpoint
 */
export async function getAddOnProductRatePlans(endpoint: OrganizationEndpoint) {
  const data: CollectionResponse<ProductRatePlan> = await endpoint(
    {
      method: 'GET',
      path: ['product_rate_plans'],
      query: {
        // eslint-disable-next-line @typescript-eslint/camelcase
        plan_type: 'add-on',
      },
    },
    alphaHeader
  );

  return data.items;
}

/**
 * Add a product rate plan given by `productRatePlanId` to the organization's subscription.
 *
 * @param {OrganizationEndpoint} endpoint
 * @param {string}               productRatePlanId
 */
export async function addProductRatePlanToSubscription(
  endpoint: OrganizationEndpoint,
  productRatePlanId: string
) {
  const response: null = await endpoint(
    {
      method: 'POST',
      path: ['plans'],
      data: {
        productRatePlanId,
      },
    },
    alphaHeader
  );

  return response;
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

  const data: CollectionResponse<ProductRatePlan> = await endpoint(
    {
      method: 'GET',
      path: ['product_rate_plans'],
      query,
    },
    alphaHeader
  );

  return data.items;
}
