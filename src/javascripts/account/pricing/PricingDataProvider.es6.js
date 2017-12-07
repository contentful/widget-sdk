import {omit} from 'lodash';

/**
 * Gets the subscription details for the org.
 */
export function getSubscription (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['subscriptions']
  }, alphaHeader).then((response) => {
    return parseSubscription(response);
  });
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

const alphaHeader = {
  'x-contentful-enable-alpha-feature': 'subscriptions-api'
};

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
