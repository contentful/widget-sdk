import {createOrganizationEndpoint} from 'data/Endpoint';
import * as auth from 'Authentication';
import {apiUrl} from 'Config';
import {fetchAll} from 'data/CMA/FetchAll';
import {omit} from 'lodash';

const BATCH_LIMIT = 100;

export function createEndpoint (orgId) {
  return createOrganizationEndpoint(apiUrl(), orgId, auth);
}

export function getAll (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['organization_memberships']
  });
}

export function getUsers (endpoint, {limit}) {
  return endpoint({
    method: 'GET',
    path: ['users'],
    query: {
      limit
    }
  });
}

/**
 * Get all spaces of the organization
 * Opposed to the TokenStore that only lists the spaces that the current user is part of,
 * this enpoint will bring all spaces of the organization.
 */
export function getSpaces (endpoint, params) {
  return endpoint({
    method: 'GET',
    path: ['spaces'],
    query: params
  });
}

export function getAllSpaces (endpoint, params) {
  return fetchAll(endpoint, ['spaces'], BATCH_LIMIT, params);
}

export function getRoles (endpoint, query) {
  return endpoint({
    method: 'GET',
    path: ['roles'],
    query
  });
}

export function getAllRoles (endpoint, params) {
  return fetchAll(endpoint, ['roles'], BATCH_LIMIT, params);
}

export function invite (endpoint, {role, email, suppressInvitation}) {
  return endpoint({
    method: 'POST',
    data: {
      role,
      email,
      suppressInvitation
    },
    path: ['organization_memberships']
  });
}

// TODO the methods below should be moved to another place

/**
 * Gets the subscription details for the org.
 */
export function getSubscription (endpoint) {
  return endpoint({
    method: 'GET',
    path: ['subscriptions']
  }).then((response) => {
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
  });
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
