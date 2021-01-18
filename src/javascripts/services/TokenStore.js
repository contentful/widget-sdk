/**
 * @ngdoc service
 * @name TokenStore
 *
 * @description
 * This service is responsible for exposing data included in the user's token
 */
import * as K from 'core/utils/kefir';
import { createMVar } from 'utils/Concurrent';
import * as auth from 'Authentication';
import makeFetchWithAuth from 'data/CMA/TokenInfo';
import ReloadNotification from 'app/common/ReloadNotification';
import * as OrganizationRoles from 'services/OrganizationRoles';
import { deepFreezeClone, deepFreeze } from 'utils/Freeze';
import { isEqual, groupBy, map, get, find, cloneDeep } from 'lodash';
import { window } from 'core/services/window';

// Refresh token info every 5 minutes
const TOKEN_INFO_REFRESH_INTERVAL = 5 * 60 * 1000;

const getFetchInfo = () => makeFetchWithAuth(auth);

/**
 * @TODO Rewrite to avoid global variables
 */

let userBus;
let spacesBus;
let organizationsBus;

// Variable storing the token data, so that it can be accessed synchronously.
// @todo - remove it and use promise
let tokenInfo;

// MVar that holds the token data
let tokenInfoMVar;

let tokenUpdate;

export let tokenUpdate$;

/**
 * @ngdoc property
 * @name TokenStore#user$
 * @type {Property<Api.User>}
 * @description
 * The current user object from the token
 */
export let user$;

/**
 * @ngdoc property
 * @name TokenStore#organizations$
 * @type {Property<Api.Organizations>}
 * @description
 * The list of organizations user is a member of from the token
 */
export let organizations$;

/**
 * @ngdoc property
 * @name TokenStore#spacesByOrganization$
 * @type {Property<object>}
 * @description
 * The list of spaces from the token grouped by organization
 */
export let spacesByOrganization$;

/**
 * @ngdoc property
 * @name TokenStore#reset$
 * @description
 * Reset global variables to initial values
 */
export const reset = () => {
  userBus = K.createPropertyBus(null);
  spacesBus = K.createPropertyBus(null);
  organizationsBus = K.createPropertyBus([]);

  tokenInfoMVar = createMVar(null);
  tokenInfo = null;
  tokenUpdate = K.createStreamBus();

  tokenUpdate$ = tokenUpdate.stream;
  user$ = userBus.property.skipDuplicates(isEqual);
  organizations$ = organizationsBus.property;
  spacesByOrganization$ = spacesBus.property.map((spaces) => {
    return spaces ? groupBy(spaces, (s) => s.organization.sys.id) : null;
  });
};

reset();

export function getTokenLookup() {
  return tokenInfo;
}

/**
 * Start refreshing the token data every five minutes and every time
 * the access token changes.
 */
export function init() {
  const offToken = K.onValue(auth.token$, refresh);
  const refreshInterval = window.setInterval(refresh, TOKEN_INFO_REFRESH_INTERVAL);

  return function deinit() {
    window.clearInterval(refreshInterval);
    offToken();
  };
}

/**
 * @ngdoc method
 * @name TokenStore#refresh
 * @returns {Promise<void>}
 * @description
 * Fetches data from the `/token` endpoint and updates the state of
 * the service with the reponse.
 *
 * Returns the response from the token endpoint.
 */
export function refresh() {
  if (!tokenInfoMVar.isEmpty()) {
    tokenInfoMVar.empty();
    getFetchInfo()().then(
      (newTokenInfo) => {
        tokenInfo = newTokenInfo;
        tokenInfoMVar.put(newTokenInfo);
        const user = newTokenInfo.sys.createdBy;
        const organizations = map(user.organizationMemberships, 'organization');
        OrganizationRoles.setUser(user);
        userBus.set(user);
        organizationsBus.set(organizations);
        spacesBus.set(prepareSpaces(newTokenInfo.spaces));
        tokenUpdate.emit();
      },
      () => {
        // We show a pop-up and logout a user if their session expired. More details: AHOY-297
        ReloadNotification.triggerAndLogout('Please authenticate again');
      }
    );
  }
  return tokenInfoMVar.read();
}

function prepareSpaces(spaces) {
  return (
    cloneDeep(spaces)
      .map((space) => {
        delete space.locales; // Do not expose token locales
        return deepFreeze(space);
      })
      // Sort by name
      .sort((a, b) => (a.name || '').localeCompare(b.name))
  );
}

/**
 * @ngdoc method
 * @name TokenStore#getSpaces
 * @returns {Promise<API.Space[]>>}
 * @description
 * This method returns a promise of the list of spaces.
 * If some calls are in progress, we're waiting until these are done.
 */
export async function getSpaces() {
  await tokenInfoMVar.read();

  return K.getValue(spacesBus.property);
}

/**
 * @ngdoc method
 * @name TokenStore#getSpace
 * @param {string} id
 * @returns {Promise<API.Space>}
 * @description
 * This method returns a promise of a single stored space
 * If some calls are in progress, we're waiting until these are done.
 * Promise is rejected if space with a provided ID couldn't be found.
 */
export async function getSpace(id) {
  const asyncError = new Error('No space with given ID could be found.');

  const spaces = await getSpaces();
  const space = find(spaces, { sys: { id } });

  if (space) {
    return space;
  } else {
    throw asyncError;
  }
}

/**
 * @ngdoc method
 * @name TokenStore#getOrganizationSpaces
 * @param {string} id
 * @returns {Promise<API.Space>}
 * @description
 * This method returns a promise of all spaces one has access to,
 * that are part of the organization with the provided ID.
 */
export async function getOrganizationSpaces(id) {
  const spaces = await getSpaces();

  return spaces.filter((space) => space.organization.sys.id === id);
}

export function getDomains() {
  const domains = get(tokenInfo, 'domains', []);

  return domains.reduce((map, value) => {
    map[value.name] = value.domain;
    return map;
  }, {});
}

/**
 * @ngdoc method
 * @name TokenStore#getOrganization
 * @param {string} id
 * @returns {Promise<API.Organization>}
 * @description
 * This method returns a promise of a single stored organization
 * If some calls are in progress, we're waiting until these are done.
 * Promise is rejected if organization with a provided ID couldn't be found.
 */
export async function getOrganization(id) {
  const asyncError = new Error('No organization with given ID could be found.');

  const orgs = await getOrganizations();

  const org = find(orgs, { sys: { id } });

  if (org) {
    return org;
  } else {
    throw asyncError;
  }
}

/**
 * @ngdoc method
 * @name TokenStore#getOrganizations
 * @returns {Array[Promise<API.Organization>]}
 * @description
 * This method returns a promise of the list of organizations.
 * If some calls are in progress, we're waiting until these are done.
 *
 */
export async function getOrganizations() {
  await tokenInfoMVar.read();

  return deepFreezeClone(K.getValue(organizationsBus.property));
}

/*
  Gets the current user value of the user$ stream
 */
export async function getUser() {
  await tokenInfoMVar.read();

  return deepFreezeClone(K.getValue(userBus.property));
}

/*
  Synchronous version of getUser above. Used in cases where you know the token is loaded
  and do not want to deal with waiting for the async getUser call.
 */
export function getUserSync() {
  return K.getValue(user$);
}

/*
  Gets the current spaces keyed by organization
  of the spacesByOrganization$ stream
 */
export function getSpacesByOrganization() {
  return K.getValue(spacesByOrganization$);
}
