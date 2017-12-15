import {omit} from 'lodash';

const alphaHeader = {
  'x-contentful-enable-alpha-feature': 'subscriptions-api'
};

/**
 * Gets the subscription details for the org.
 */
export function getSubscription (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['subscriptions']
  }, alphaHeader).then(parseSubscription);
}

/**
 * Gets the space plans for the org with corresponding spaces details
 */
export function getSpacePlans (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['plans']
  }, alphaHeader);
}

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
 * @param {object} endpoint a subscription endpoint
 * @returns {Promise<object>} base subscription object
 */
export function getBasePlan (endpoint) {
  return getSubscriptionPlans(endpoint, {type: 'base'})
    // although you can only have 1 base plan, the endpoint
    // still returns a list
    .then(data => data.items[0]);
}

function parseSubscription (rawData) {
  // TODO use generic link resolver ?
  const rawSubscription = rawData.items[0];
  const subscription = omit(rawSubscription, 'plans');
  const includes = Object.keys(rawData.includes)
    .reduce((includes, key) => {
      includes[key] = rawData.includes[key].reduce((hash, item) => {
        hash[item.sys.id] = item;
        return hash;
      }, {});
      return includes;
    }, {});

  subscription.plans = rawSubscription.plans
    .map(({sys}) => includes[sys.linkType][sys.id]);

  return subscription;
}
