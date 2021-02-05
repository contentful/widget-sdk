import { OrganizationEndpoint, CollectionResponse } from './types/Generic';
import { Plan, BasePlan, SpacePlan } from './types/Plan';
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
export async function getSpacePlans(endpoint: OrganizationEndpoint) {
  const data = await withAlphaHeader<CollectionResponse<SpacePlan>>(endpoint)({
    method: 'GET',
    path: ['plans'],
    query: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      plan_type: 'space',
    },
  });

  return data.items;
}

/**
 * Get a plan for a single space.
 *
 * @param {OrganizationEndpoint} endpoint
 * @param {string}               spaceId
 */
export async function getSpacePlanForSpace(endpoint: OrganizationEndpoint, spaceId: string) {
  const data = await withAlphaHeader<CollectionResponse<SpacePlan>>(endpoint)({
    method: 'GET',
    path: ['plans'],
    query: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      plan_type: 'space',

      // eslint-disable-next-line @typescript-eslint/camelcase
      gatekeeper_key: spaceId,
    },
  });

  return data.items[0];
}

/**
 * Update a space plan with new data.
 *
 * The only required attributes are the `sys.id` and `gatekeeperKey`, where `gatekeeperKey` is
 * the `spaceId` of the space that have the plan assigned to it.
 *
 * @param {OrganizationEndpoint} endpoint
 * @param {SpacePlan} plan
 */
export async function updateSpacePlan(endpoint: OrganizationEndpoint, plan: SpacePlan) {
  const updatedPlan = await withAlphaHeader<SpacePlan>(endpoint)({
    method: 'PUT',
    path: ['plans', plan.sys.id],
    data: plan,
  });

  return updatedPlan;
}

/**
 * Get the base plan (the platform) for the organization.
 *
 * @param {OrganizationEndpoint} endpoint
 */
export async function getBasePlan(endpoint: OrganizationEndpoint) {
  const data = await withAlphaHeader<CollectionResponse<BasePlan>>(endpoint)({
    method: 'GET',
    path: ['plans'],
    query: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      plan_type: 'base',
    },
  });

  return data.items[0];
}

/**
 * Get all plans for the organization's subscription.
 *
 * @param {OrganizationEndpoint} endpoint
 */
export async function getAllPlans(endpoint: OrganizationEndpoint) {
  const data = await withAlphaHeader<CollectionResponse<Plan>>(endpoint)({
    method: 'GET',
    path: ['plans'],
  });

  return data.items;
}
