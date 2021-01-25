import { get, uniqueId, uniq } from 'lodash';
import { getAllSpaces, getUsersByIds } from 'access_control/OrganizationMembershipRepository';
import { getAllPlans } from 'features/pricing-entities';
import { SUBSCRIPTIONS_API, getAlphaHeader } from 'alphaHeaders.js';

const alphaHeader = getAlphaHeader(SUBSCRIPTIONS_API);

export const SELF_SERVICE = 'Self-service';
export const ENTERPRISE = 'Enterprise';
const ENTERPRISE_TRIAL = 'Enterprise Trial';
export const ENTERPRISE_HIGH_DEMAND = 'Enterprise High Demand';
export const FREE = 'Free';
export const PARTNER_PLATFORM_BASE_PLAN_NAME = 'Partner Platform';
export const TRIAL_SPACE_FREE_SPACE_PLAN_NAME = 'Trial Space';
export const POC_FREE_SPACE_PLAN_NAME = 'Proof of Concept';

export const customerTypes = {
  free: [FREE],
  selfService: [SELF_SERVICE],
  enterprise: [ENTERPRISE, ENTERPRISE_TRIAL, ENTERPRISE_HIGH_DEMAND],
};

export function isSelfServicePlan(plan) {
  return customerTypes.selfService.includes(plan.customerType);
}

export function isEnterprisePlan(plan) {
  return customerTypes.enterprise.includes(plan.customerType);
}

export function isFreePlan(plan) {
  return customerTypes.free.includes(plan.customerType);
}

export function isHighDemandEnterprisePlan(plan) {
  return plan.customerType === ENTERPRISE_HIGH_DEMAND;
}

export function isPartnerPlan(plan) {
  return plan.name === PARTNER_PLATFORM_BASE_PLAN_NAME;
}

export function isFreeSpacePlan(plan) {
  // free plans do not have subscription plans
  // a plan object is created by the user interface
  // so `planType` is a hardcoded value.
  // regular paid spaces have planType of `space`
  return plan.planType === 'free_space';
}

export function isFreeProductPlan(plan) {
  return plan.productPlanType === 'free_space';
}

export function isPOCSpacePlan(plan) {
  return isEnterprisePlan(plan) && isFreeSpacePlan(plan);
}

/**
 * Get all subscription plans (base and space) of the org with the associated
 * spaces for space plans, free spaces, and linked user data for each space's
 * `createdBy` field.
 * @param {object} endpoint an organization endpoint
 * @returns {object} subscription plans w. spaces & users
 */
export async function getPlansWithSpaces(endpoint) {
  const [productPlans, subscriptionPlans, spaces] = await Promise.all([
    getProductPlans(endpoint),
    getAllPlans(endpoint),
    getAllSpaces(endpoint),
  ]);

  const userIds = uniq(spaces.map((space) => get(space, 'sys.createdBy.sys.id')));
  const users = await getUsersByIds(endpoint, userIds);

  const linkUser = (space) => ({
    ...space,
    sys: {
      ...space.sys,
      createdBy: users.find(({ sys }) => sys.id === get(space, 'sys.createdBy.sys.id')),
    },
  });

  const freeSpaceProductPlan = productPlans.find(
    (productPlan) => productPlan.productPlanType === 'free_space'
  );

  const spacesWithoutSubscriptionPlan = spaces.filter(
    (space) => !subscriptionPlans.items.some(({ gatekeeperKey }) => space.sys.id === gatekeeperKey)
  );

  return {
    plans: subscriptionPlans,
    items: [
      ...subscriptionPlans.items.map((subscriptionPlan) => ({
        ...subscriptionPlan,
        ...(subscriptionPlan.gatekeeperKey && {
          space: linkUser(spaces.find(({ sys }) => sys.id === subscriptionPlan.gatekeeperKey)),
        }),
      })),
      // TODO: Handle Community, Exempt(e.g P&G) and Complimentary in GK
      ...spacesWithoutSubscriptionPlan.map((space) => ({
        sys: { id: uniqueId('free-space-plan-') },
        gatekeeperKey: space.sys.id,
        name: freeSpaceProductPlan.name,
        planType: 'free_space',
        space: linkUser(space),
      })),
    ],
  };
}

export function changeSpacePlan(endpoint, productRatePlanId) {
  return endpoint(
    {
      method: 'PUT',
      path: [],
      data: {
        productRatePlanId,
      },
    },
    alphaHeader
  );
}

/**
 * Update a space plan with a new assigned space.
 * The only required attributes are the `sys.id` and `gatekeeperKey`, `gatekeeperKey` being the space id.
 * @param {object} orgEndpoint
 * @param {object} plan a space plan object containing a `gatekeeperKey` property with a space id as the value
 * @returns{Promise<object>} updated plan
 */
export function updateSpacePlan(orgEndpoint, plan) {
  const planId = plan?.sys?.id;

  return orgEndpoint(
    {
      method: 'PUT',
      path: ['plans', planId],
      data: plan,
    },
    alphaHeader
  );
}

/**
 * Gets the list of enabled features for the org such as offsite backup.
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} array of features in {name, internal_name}
 * format.
 */
export function getEnabledFeatures(endpoint) {
  return endpoint(
    {
      method: 'GET',
      path: ['features'],
    },
    alphaHeader
  ).then((features) => (features && features.items) || []);
}

/**
 * Get base and all space rate plans available for the organization
 */
export function getProductPlans(endpoint) {
  return endpoint(
    {
      method: 'GET',
      path: ['product_rate_plans'],
    },
    alphaHeader
  ).then((data) => data.items);
}

/**
 * Receives an array of subscription plans and calculates the grand total
 * @param {object[]} subscriptionPlans
 * @returns {number}
 */
export function calculateTotalPrice(subscriptionPlans) {
  return subscriptionPlans.reduce((total, plan) => total + (parseInt(plan.price, 10) || 0), 0);
}
