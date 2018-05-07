import {get, uniqueId} from 'lodash';
import {getAllSpaces, getUsersByIds} from 'access_control/OrganizationMembershipRepository';

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
export function getPlansWithSpaces (endpoint) {
  return Promise.all([
    getSubscriptionPlans(endpoint),
    getAllSpaces(endpoint)
  ])
    // Map spaces to space plans, create 'free plan' objects for spaces w/o plans
    .then(([plans, spaces]) => {
      const freeSpaces = spaces.filter(
        (space) => !plans.items.find(({gatekeeperKey}) => space.sys.id === gatekeeperKey)
      );
      return {
        plans,
        items: [
          // Space plans from the endpoint
          ...plans.items.map((plan) => ({
            ...plan,
            space: plan.gatekeeperKey && spaces.find(({sys}) => sys.id === plan.gatekeeperKey)
          })),
          // 'Free plan' objects for spaces w/o a space plan
          ...freeSpaces.map((space) => ({
            sys: {id: uniqueId('free-space-plan-')},
            gatekeeperKey: space.sys.id,
            planType: 'space',
            name: 'Free',
            space
          }))
        ]
      };
    })

    // Load `createdBy` users for all spaces
    .then((plans) => {
      const userIds = plans.items.map(({space}) => get(space, 'sys.createdBy.sys.id'));
      return getUsersByIds(endpoint, userIds).then((users) => [plans, users]);
    })

    // Map users to spaces
    .then(([plans, users]) => ({
      ...plans,
      items: plans.items.map((plan) => ({
        ...plan,
        space: plan.space && {
          ...plan.space,
          sys: {
            ...plan.space.sys,
            createdBy: users.find(({sys}) => sys.id === plan.space.sys.createdBy.sys.id)
          }
        }
      }))
    }));
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
export function getSpaceRatePlans (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['product_rate_plans'],
    query: {'plan_type': 'space'}
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
