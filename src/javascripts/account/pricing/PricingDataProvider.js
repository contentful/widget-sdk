import { get, uniqueId, uniq, reject } from 'lodash';
import { getAllSpaces, getUsersByIds } from 'access_control/OrganizationMembershipRepository';
import { SUBSCRIPTIONS_API, getAlphaHeader } from 'alphaHeaders.js';
const alphaHeader = getAlphaHeader(SUBSCRIPTIONS_API);

const SELF_SERVICE = 'Self-service';
const ENTERPRISE = 'Enterprise';
const ENTERPRISE_TRIAL = 'Enterprise Trial';
const ENTERPRISE_HIGH_DEMAND = 'High Demand Enterprise';

export const customerTypes = {
  selfService: [SELF_SERVICE],
  enterprise: [ENTERPRISE, ENTERPRISE_TRIAL, ENTERPRISE_HIGH_DEMAND]
};

export function isSelfServicePlan(plan) {
  return customerTypes.selfService.includes(plan.customerType);
}

export function isEnterprisePlan(plan) {
  return customerTypes.enterprise.includes(plan.customerType);
}

export function isHighDemandEnterprisePlan(plan) {
  return plan.customerType === ENTERPRISE_HIGH_DEMAND;
}

export function isFreeSpacePlan(plan) {
  // free plans do not have subscription plans
  // a plan object is created by the user interface
  // so `planType` is a hardcoded value.
  // regular paid spaces have planType of `space`
  return plan.planType === 'free_space';
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
      query: params
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
      .then(data => data.items[0])
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
  const [baseRatePlan, plans, spaces] = await Promise.all([
    getBaseRatePlan(endpoint),
    getSubscriptionPlans(endpoint),
    getAllSpaces(endpoint)
  ]);

  const findSpaceByPlan = plan =>
    plan.gatekeeperKey && spaces.find(({ sys }) => sys.id === plan.gatekeeperKey);
  // Map spaces to space plans, create 'free plan' objects for spaces w/o plans
  const isFreeSpace = space =>
    !plans.items.find(({ gatekeeperKey }) => space.sys.id === gatekeeperKey);
  const freeSpaces = spaces.filter(isFreeSpace);
  const isEnterprise = baseRatePlan && isEnterprisePlan(baseRatePlan);
  const isHighDemand = baseRatePlan && isHighDemandEnterprisePlan(baseRatePlan);

  const plansWithSpaces = {
    plans,
    items: [
      // Space plans from the endpoint
      ...plans.items.map(plan => ({
        ...plan,
        space: findSpaceByPlan(plan)
      })),
      // 'Free plan' objects for spaces w/o a space plan
      ...freeSpaces.map(space => ({
        sys: { id: uniqueId('free-space-plan-') },
        gatekeeperKey: space.sys.id,
        name: getFreeSpacePlanName(isEnterprise, isHighDemand),
        planType: 'free_space',
        space
      }))
    ]
  };

  // Get unique `createdBy` users for all spaces
  const userIds = reject(
    uniq(plansWithSpaces.items.map(({ space }) => get(space, 'sys.createdBy.sys.id'))),
    i => !i
  );
  const users = await getUsersByIds(endpoint, userIds);
  // Map users to spaces
  return {
    ...plansWithSpaces,
    items: plansWithSpaces.items.map(plan => ({
      ...plan,
      space: plan.space && {
        ...plan.space,
        sys: {
          ...plan.space.sys,
          createdBy: users.find(({ sys }) => sys.id === plan.space.sys.createdBy.sys.id)
        }
      }
    }))
  };
}

export function changeSpace(endpoint, productRatePlanId) {
  return endpoint(
    {
      method: 'PUT',
      path: [],
      data: {
        productRatePlanId: productRatePlanId
      }
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
      path: ['features']
    },
    alphaHeader
  ).then(features => (features && features.items) || []);
}

/* Gets the space plan for the space with corresponding space id
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object>} space plan object
 */
export function getSingleSpacePlan(endpoint, spaceId) {
  return getSubscriptionPlans(endpoint, {
    plan_type: 'space',
    gatekeeper_key: spaceId
  }).then(data => data.items[0]);
}

export function getBaseRatePlan(endpoint) {
  const query = {
    plan_type: 'base'
  };

  return endpoint(
    {
      method: 'GET',
      path: ['product_rate_plans'],
      query
    },
    alphaHeader
  ).then(data => data.items[0]);
}

/* Gets collection of space product rate plans.
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} product rate plans
 */
export function getSpaceRatePlans(endpoint, spaceId) {
  const query = {
    plan_type: 'space'
  };

  if (spaceId) {
    query.space_id = spaceId;
  }

  return endpoint(
    {
      method: 'GET',
      path: ['product_rate_plans'],
      query
    },
    alphaHeader
  ).then(data => data.items);
}

/**
 * Get base and all space rate plans available for the organization
 */
export function getRatePlans(endpoint) {
  return endpoint(
    {
      method: 'GET',
      path: ['product_rate_plans']
    },
    alphaHeader
  ).then(data => data.items);
}

/**
 * Receives an array of subscription plans and calculates the grand total
 * @param {object[]} subscriptionPlans
 * @returns {number}
 */
export function calculateTotalPrice(subscriptionPlans) {
  return subscriptionPlans.reduce((total, plan) => total + (parseInt(plan.price, 10) || 0), 0);
}

// Get the name for the free plan name according to customer type,
// which is set on the base rate plan
// Free spaces don't generate subscriptions, that's why we can't know for sure
// which rate plan it's based on.
// A workaround that would be to return mocked space subscription objects from the API
function getFreeSpacePlanName(isEnterprise, isHighDemand) {
  if (isHighDemand) return 'Performance 1x';
  if (isEnterprise) return 'Proof of concept';
  return 'Free';
}
