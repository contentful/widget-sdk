import {omit, get, identity} from 'lodash';
import {getAllSpaces, getUsers} from 'access_control/OrganizationMembershipRepository';

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
 * spaces for space plans, and user data for each space's `createdBy` field.
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} array of subscription plans w. spaces & users
 */
export function getPlansWithSpaces (endpoint, params = {}) {
  // Note: it loads paginated data from the `plans` endpoint, but all spaces
  // are loaded at once to map plans to spaces.

  return Promise.all([
    getSubscriptionPlans(endpoint, params),
    getAllSpaces(endpoint)
  ])
    // Map spaces to space plans
    .then(([plans, spaces]) => ({
      ...omit(plans, 'items'),
      items: plans.items.map((plan) => ({
        ...plan,
        space: plan.gatekeeperKey && spaces.find(({sys}) => sys.id === plan.gatekeeperKey)
      }))
    }))

    // Load `createdBy` users for all spaces
    // Note: only max. 46 users can be fetched with query string limitation of 1024 chars
    .then((plans) => {
      const userIds = plans.items
        .map(({space}) => get(space, 'sys.createdBy.sys.id'))
        .filter(identity);

      return getUsers(endpoint, {
        'user_ids': userIds.join(',')
      }).then((users) => [plans, users.items]);
    })

    // Map users to spaces
    .then(([plans, users]) => ({
      ...omit(plans, 'items'),
      items: plans.items.map((plan) => ({
        ...plan,
        space: plan.space && {
          ...omit(plan.space, 'sys'),
          sys: {
            ...omit(plan.space.sys, 'createdBy'),
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
