import { get, uniqueId, uniq, reject } from 'lodash';
import { getAllSpaces, getUsersByIds } from 'access_control/OrganizationMembershipRepository';
import { SUBSCRIPTIONS_API, getAlphaHeader } from 'alphaHeaders.js';
const alphaHeader = getAlphaHeader(SUBSCRIPTIONS_API);

export const SELF_SERVICE = 'Self-service';
export const ENTERPRISE = 'Enterprise';
const ENTERPRISE_TRIAL = 'Enterprise Trial';
export const ENTERPRISE_HIGH_DEMAND = 'Enterprise High Demand';
export const FREE = 'Free';
export const ENTERPRISE_TRIAL_BASE_PLAN_NAME = 'Professional Trial';
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

export function isEnterpriseTrialPlan(plan) {
  return plan.name === ENTERPRISE_TRIAL_BASE_PLAN_NAME;
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
 * Load all subscription plans (space and base) from organization endpoint.
 * Note: this collection endpoint doesn't have pagination.
 *
 * @param {object}  endpoint - organization endpoint
 * @param {string?} params.plan_type - 'base' or 'space'
 * @returns {Promise<object>}
 *
 */
export function getSubscriptionPlans(endpoint, params) {
  return endpoint(
    {
      method: 'GET',
      path: ['plans'],
      query: params,
    },
    alphaHeader
  );
}

/**
 * Get platform base plan
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object>} base plan object
 */
export function getBasePlan(endpoint) {
  return (
    getSubscriptionPlans(endpoint, { plan_type: 'base' })
      // although you can only have 1 base plan, the endpoint
      // still returns a list
      .then((data) => data.items[0])
  );
}

/**
 * Gets all subscription plans (base and space) of the org with the associated
 * spaces for space plans, free spaces, and linked user data for each space's
 * `createdBy` field.
 * @param {object} endpoint an organization endpoint
 * @param {boolean} is POC enabled
 * @returns {Promise<object[]>} array of subscription plans w. spaces & users
 */

export async function getPlansWithSpaces(endpoint) {
  const [ratePlans, subscriptions, spaces] = await Promise.all([
    getRatePlans(endpoint),
    getSubscriptionPlans(endpoint),
    getAllSpaces(endpoint),
  ]);

  const freeSpaceRatePlan = ratePlans.find((plan) => plan.productPlanType === 'free_space');

  const spaceSubscriptions = subscriptions.items.filter(
    (subscription) => subscription.planType === 'space'
  );

  const freeSpaces = spaces.filter((space) => {
    // find all spaces that don't have a matching subscription.
    // gatekeeperKey is the space ID
    return !spaceSubscriptions.some(({ gatekeeperKey }) => space.sys.id === gatekeeperKey);
  });

  const findSpaceByPlan = (plan) =>
    plan.gatekeeperKey && spaces.find(({ sys }) => sys.id === plan.gatekeeperKey);

  const plansWithSpaces = {
    plans: subscriptions,
    items: [
      ...subscriptions.items.map((plan) => ({
        ...plan,
        space: findSpaceByPlan(plan),
      })),
      ...freeSpaces.map((space) => ({
        sys: { id: uniqueId('free-space-plan-') },
        gatekeeperKey: space.sys.id,
        name: freeSpaceRatePlan.name,
        planType: 'free_space',
        space,
      })),
    ],
  };

  // Get unique `createdBy` users for all spaces
  const userIds = reject(
    uniq(plansWithSpaces.items.map(({ space }) => get(space, 'sys.createdBy.sys.id'))),
    (i) => !i
  );
  const users = await getUsersByIds(endpoint, userIds);
  // Map users to spaces
  return {
    ...plansWithSpaces,
    items: plansWithSpaces.items.map((plan) => ({
      ...plan,
      space: plan.space && {
        ...plan.space,
        sys: {
          ...plan.space.sys,
          createdBy: users.find(({ sys }) => sys.id === plan.space.sys.createdBy.sys.id),
        },
      },
    })),
  };
}

export function changeSpacePlan(endpoint, productRatePlanId) {
  return endpoint(
    {
      method: 'PUT',
      path: [],
      data: {
        productRatePlanId: productRatePlanId,
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

/* Gets the space plan for the space with corresponding space id
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object>} space plan object
 */
export function getSingleSpacePlan(endpoint, spaceId) {
  return getSubscriptionPlans(endpoint, {
    plan_type: 'space',
    gatekeeper_key: spaceId,
  }).then((data) => data.items[0]);
}

export function getBaseSubscription(endpoint) {
  const query = {
    plan_type: 'base',
  };

  return endpoint(
    {
      method: 'GET',
      path: ['plans'],
      query,
    },
    alphaHeader
  ).then((data) => data.items[0]);
}

/* Gets collection of space product rate plans.
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} product rate plans
 */
export function getSpaceRatePlans(endpoint, spaceId) {
  const query = {
    plan_type: 'space',
  };

  if (spaceId) {
    query.space_id = spaceId;
  }

  return endpoint(
    {
      method: 'GET',
      path: ['product_rate_plans'],
      query,
    },
    alphaHeader
  ).then((data) => data.items);
}

/**
 * Get base and all space rate plans available for the organization
 */
export function getRatePlans(endpoint) {
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
