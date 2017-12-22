const alphaHeader = {
  'x-contentful-enable-alpha-feature': 'subscriptions-api'
};

/**
 * @param {object?} params
 * @param {string?} params.type base, space
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
  return getSubscriptionPlans(endpoint, {type: 'base'})
    // although you can only have 1 base plan, the endpoint
    // still returns a list
    .then(data => data.items[0]);
}

/**
 * Gets the space plans for the org with corresponding spaces details
 * @param {object} endpoint an organization endpoint
 * @returns {Promise<object[]>} array of space plans
 */
export function getSpacePlans (endpoint) {
  return getSubscriptionPlans(endpoint, {type: 'space'})
    .then(data => data.items);
}
