import {omit} from 'lodash';
import {getAllSpaces} from 'access_control/OrganizationMembershipRepository';

const alphaHeader = {
  'x-contentful-enable-alpha-feature': 'subscriptions-api'
};

/**
 * @param {object}  endpoint organization endpoint
 * @param {object?} params
 * @param {string?} params.plan_type base, space
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
 * spaces for space plans.
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} array of subscription plans
 */
export function getPlansWithSpaces (endpoint, params = {}) {
  // Note: it loads paginated data from the `plans` endpoint, but all spaces
  // are loaded at once to map plans to spaces.
  return Promise.all([
    getAllSpaces(endpoint),
    getSubscriptionPlans(endpoint, params)
  ]).then(([spaces, plans]) => ({
    ...omit(plans, 'items'),
    items: plans.items.map((plan) => ({
      ...plan,
      space: plan.gatekeeperKey && spaces.find(({sys}) => sys.id === plan.gatekeeperKey)
    }))
  }));
}

/**
 * Gets the list of enabled features for the org such as offsite backup.
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} array of features in {name, internal_name}
 * format.
 */
export function getEnabledOrgFeatures (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['features']
  }, alphaHeader).then(features => features.items);
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
