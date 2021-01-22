import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { ProductRatePlan } from './types';
import { SUBSCRIPTIONS_API, getAlphaHeader } from 'alphaHeaders.js';

type CollectionResponse<T> = {
  sys: {
    type: 'Array';
  };
  total: number;
  items: T[];
};

type OrganizationEndpoint = ReturnType<typeof createOrganizationEndpoint>;

const alphaHeader = getAlphaHeader(SUBSCRIPTIONS_API);

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
