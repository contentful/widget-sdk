import {omit} from 'lodash';

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
 * Gets the space plans for the org
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} array of space plans
 */
export function getSpacePlans (endpoint) {
  return getSubscriptionPlans(endpoint, {plan_type: 'space'})
    .then(data => data.items);
}

/**
 * Gets all spaces of the org with the associated subscription plans. Note that
 * a space's plan can be empty.
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} array of spaces with plans
 */
export function getSpacesWithPlans (endpoint) {
  // TODO: take care of pagination: this function should return paginated data
  // from the `spaces` endpoint, but all space plans must be loaded at once
  // to make the mapping.
  return Promise.all([
    getSpaces(endpoint),
    getSubscriptionPlans(endpoint, {plan_type: 'space'})
  ]).then(([spaces, plans]) => ({
    ...omit(spaces, 'items'),
    items: spaces.items.map((space) => ({
      ...space,
      plan: plans.items.find(({gatekeeperKey}) => gatekeeperKey === space.sys.id)
    }))
  }));
}

/**
 * TODO: will be used later in access checker
 *
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

function getSpaces (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['spaces']
  });
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
