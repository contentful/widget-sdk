/**
 * @ngdoc service
 * @name TokenStore
 *
 * @description
 * This service is responsible for exposing data included in the user's token
 */
import $q from '$q';
import * as K from 'utils/kefir';
import { createMVar } from 'utils/Concurrent';
import * as auth from 'Authentication';
import makeFetchWithAuth from 'data/CMA/TokenInfo';
import ReloadNotification from 'ReloadNotification';
import * as OrganizationRoles from 'services/OrganizationRoles';
import $window from '$window';
import { deepFreezeClone, deepFreeze } from 'utils/Freeze';
import { isEqual, groupBy, map, get, find, cloneDeep } from 'lodash';

// Refresh token info every 5 minutes
const TOKEN_INFO_REFRESH_INTERVAL = 5 * 60 * 1000;

const fetchInfo = makeFetchWithAuth(auth);

const userBus = K.createPropertyBus(null);
const spacesBus = K.createPropertyBus(null);
const organizationsBus = K.createPropertyBus([]);

// Variable storing the token data, so that it can be accessed synchronously.
// @todo - remove it and use promise
let tokenInfo = null;

// MVar that holds the token data
const tokenInfoMVar = createMVar(null);

/**
 * @ngdoc property
 * @name TokenStore#user$
 * @type {Property<Api.User>}
 * @description
 * The current user object from the token
 */
export const user$ = userBus.property.skipDuplicates(isEqual);

/**
 * @ngdoc property
 * @name TokenStore#organizations$
 * @type {Property<Api.Organizations>}
 * @description
 * The list of organizations user is a member of from the token
 */
export const organizations$ = organizationsBus.property;

/**
 * @ngdoc property
 * @name TokenStore#spacesByOrganization$
 * @type {Property<object>}
 * @description
 * The list of spaces from the token grouped by organization
 */
export const spacesByOrganization$ = spacesBus.property.map(spaces => {
  return spaces ? groupBy(spaces, s => s.organization.sys.id) : null;
});

export function getTokenLookup() {
  return tokenInfo;
}

/**
 * Start refreshing the token data every five minutes and every time
 * the access token changes.
 */
export function init() {
  const offToken = K.onValue(auth.token$, refresh);
  const refreshInterval = $window.setInterval(refresh, TOKEN_INFO_REFRESH_INTERVAL);

  return function deinit() {
    $window.clearInterval(refreshInterval);
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
    fetchInfo().then(
      newTokenInfo => {
        tokenInfo = newTokenInfo;
        tokenInfoMVar.put(newTokenInfo);
        const user = newTokenInfo.sys.createdBy;
        const organizations = map(user.organizationMemberships, 'organization');
        OrganizationRoles.setUser(user);
        userBus.set(user);
        organizationsBus.set(organizations);
        spacesBus.set(prepareSpaces(newTokenInfo.spaces));
      },
      () => {
        ReloadNotification.trigger('The application was unable to authenticate with the server');
      }
    );
  }
  return tokenInfoMVar.read();
}

function prepareSpaces(spaces) {
  return (
    cloneDeep(spaces)
      .map(space => {
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
 * @returns {Promise<API.Space>[]>}
 * @description
 * This method returns a promise of the list of spaces.
 * If some calls are in progress, we're waiting until these are done.
 */
export function getSpaces() {
  return tokenInfoMVar.read().then(() => K.getValue(spacesBus.property));
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
export function getSpace(id) {
  return getSpaces().then(spaces => {
    const found = find(spaces, { sys: { id } });
    return found || Promise.reject(new Error('No space with given ID could be found.'));
  });
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
export function getOrganization(id) {
  return getOrganizations().then(orgs => {
    const org = find(orgs, { sys: { id: id } });
    return org || $q.reject(new Error('No organization with given ID could be found.'));
  });
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
export function getOrganizations() {
  return tokenInfoMVar.read().then(() => deepFreezeClone(K.getValue(organizationsBus.property)));
}
