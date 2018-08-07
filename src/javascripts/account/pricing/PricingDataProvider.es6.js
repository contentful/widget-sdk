import {get, uniqueId} from 'lodash';
import {getAllSpaces, getUsersByIds} from 'access_control/OrganizationMembershipRepository';
import {getCurrentVariation} from 'utils/LaunchDarkly';

const alphaHeader = {
  'x-contentful-enable-alpha-feature': 'subscriptions-api'
};

/**
 * Load all subscription plans (space and base) from organization endpoint.
 * Note: this collection endpoint doesn't have pagination.
 *
 * @param {object}  endpoint - organization endpoint
 * @param {string?} params.plan_type - 'base' or 'space'
 * @returns {Promise<object>}
 *
 */
export function getSubscriptionPlans (endpoint, params) {
  return endpoint({
    method: 'GET',
    path: ['plans'],
    query: params
  }, alphaHeader);
}

/**
 * Get platform base plan
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object>} base plan object
 */
export function getBasePlan (endpoint) {
  return getSubscriptionPlans(endpoint, {plan_type: 'base'})
    // although you can only have 1 base plan, the endpoint
    // still returns a list
    .then(data => data.items[0]);
}

/**
 * Gets all subscription plans (base and space) of the org with the associated
 * spaces for space plans, free spaces, and linked user data for each space's
 * `createdBy` field.
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} array of subscription plans w. spaces & users
 */
export async function getPlansWithSpaces (endpoint) {
  const [plans, spaces, usePOC] = await Promise.all([
    getSubscriptionPlans(endpoint),
    getAllSpaces(endpoint),
    isPOCEnabled()
  ]);
  const findSpaceByPlan = plan => plan.gatekeeperKey && spaces.find(({sys}) => sys.id === plan.gatekeeperKey);
  // Map spaces to space plans, create 'free plan' objects for spaces w/o plans
  const isFreeSpace = space => !plans.items.find(({gatekeeperKey}) => space.sys.id === gatekeeperKey);
  const freeSpaces = spaces.filter(isFreeSpace);
  const basePlan = plans.items.find(plan => plan.planType === 'base');
  const isEnterprise = basePlan && basePlan.committed;

  const plansWithSpaces = {
    plans,
    items: [
      // Space plans from the endpoint
      ...plans.items.map((plan) => ({
        ...plan,
        space: findSpaceByPlan(plan)
      })),
      // 'Free plan' objects for spaces w/o a space plan
      ...freeSpaces.map((space) => ({
        sys: {id: uniqueId('free-space-plan-')},
        gatekeeperKey: space.sys.id,
        planType: 'space',
        name: (isEnterprise && usePOC) ? 'Proof of concept' : 'Free',
        space
      }))
    ]
  };

  // Load `createdBy` users for all spaces
  const userIds = plansWithSpaces.items.map(({space}) => get(space, 'sys.createdBy.sys.id'));
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
          createdBy: users.find(({sys}) => sys.id === plan.space.sys.createdBy.sys.id)
        }
      }
    }))
  };
}

export function changeSpace (endpoint, planId) {
  return endpoint({
    method: 'PUT',
    path: [],
    data: {
      productRatePlanId: planId
    }
  }, alphaHeader);
}

/**
 * Gets the list of enabled features for the org such as offsite backup.
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} array of features in {name, internal_name}
 * format.
 */
export function getEnabledFeatures (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['features']
  }, alphaHeader).then(features => (features && features.items) || []);
}

/* Gets the space plan for the space with corresponding space id
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object>} space plan object
 */
export function getSingleSpacePlan (endpoint, spaceId) {
  return getSubscriptionPlans(endpoint, {
    plan_type: 'space', gatekeeper_key: spaceId
  })
    .then(data => data.items[0]);
}

/* Gets collection of space product rate plans.
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} product rate plans
 */
export function getSpaceRatePlans (endpoint, spaceId) {
  const query = {
    plan_type: 'space'
  };

  if (spaceId) {
    query.space_id = spaceId;
  }

  return endpoint({
    method: 'GET',
    path: ['product_rate_plans'],
    query: query
  }, alphaHeader).then((data) => data.items);
}

/**
 * Receives an array of subscription plans and calculates the grand total
 * @param {object[]} subscriptionPlans
 * @returns {number}
 */
export function calculateTotalPrice (subscriptionPlans) {
  return subscriptionPlans.reduce(
    (total, plan) => total + (parseInt(plan.price, 10) || 0),
    0
  );
}

/**
 * Check feature flag for Proof of Concept spaces in Enterprise orgs
 * @returns {Promise<Boolean>}
 */
export function isPOCEnabled () {
  return getCurrentVariation('feature-bv-07-2018-enterprise-poc-spaces');
}
