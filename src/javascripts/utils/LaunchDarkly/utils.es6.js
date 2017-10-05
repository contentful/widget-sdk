import moment from 'moment';
import $rootScope from '$rootScope';
import spaceContext from 'spaceContext';

import {assign, isEqual, find, get, includes, keys} from 'lodash';
import {organizations$, user$, spacesByOrganization$} from 'services/TokenStore';

import {
  combine,
  getValue,
  createPropertyBus
} from 'utils/kefir';

/**
 * @name utils/LaunchDarkly/utils#userDataStream$
 * @description
 * A stream combining user, current org, current space and spaces grouped by org id
 */
export const userDataStream$ = combine(
  [user$, getCurrentOrgAndSpaceStream(), spacesByOrganization$],
  (user, [org, space], spacesByOrg) => [user, org, spacesByOrg, space])
  .filter(([user, org, spacesByOrg]) => user && user.email && org && spacesByOrg) // space is a Maybe
  .skipDuplicates(isEqual);

/**
 * @name utils/LaunchDarkly/utils#getOrgRole
 * @description
 * Get the user role for a given org id
 *
 * @param {Array<Object>} orgMemberships
 * @param {String} orgId
 * @returns {String} orgRole
 */
export function getOrgRole (orgMemberships, orgId) {
  const org = find(orgMemberships, ({organization: {sys: {id}}}) => orgId === id) || { role: '<no role found>' };

  return org.role;
}

/**
 * @name utils/LaunchDarkly/utils#getUserAgeInDays
 * @description
 * Get the user's age in days (age = now - createdAt in days)
 *
 * @param {Date} createdAt - user createdAt data
 * @returns {Number} user age
 */
export function getUserAgeInDays (createdAt) {
  const creationDate = moment(createdAt);
  const now = moment();

  return now.diff(creationDate, 'days');
}

/**
 * @name LaunchDarkly/utils#isNonPayingUser
 *
 * @description
 * Given a user, this returns true if none of the orgs that the user
 * belongs to is a paying org.
 * Return true if the user belongs to NO paying orgs
 * A qualified user doesn't belong to a paying/converted org
 *
 * @param {Object} user
 * @returns {boolean}
 */
export function isNonPayingUser ({organizationMemberships}) {
  const convertedStatuses = ['paid', 'free_paid'];

  // disqualify all users that don't belong to any org
  if (!organizationMemberships) {
    return false;
  }

  return !organizationMemberships.reduce((acc, {organization}) => {
    const {subscription: {status: orgStatus}} = organization;
    const isOrgConverted = includes(convertedStatuses, orgStatus);

    return acc || isOrgConverted;
  }, false);
}

/**
 * @name getChangesObject
 * @usage[js]
 * getChangesObject({a: 10, b: 20, m: Symbol('a')}, {a: 10, b: 30, c: 'test'})
 * // => {b: 30, c: 'test'}
 *
 * @description
 * This method does a trivial shallow diff between two objects
 * and returns a new object which has all key/value pairs from the new
 * object with duplicated and removed keys from old object deleted.
 *
 * @param {Object} oldObj
 * @param {Object} newObj
 * @returns {Object} shallow diff of input objects
 */
export function getChangesObject (oldObj = {}, newObj = {}) {
  const retObj = assign({}, newObj);

  keys(oldObj).forEach(key => {
    if (oldObj[key] === newObj[key]) {
      delete retObj[key];
    }
  });

  return retObj;
}

/**
 * Implemented together since we want the org and space
 * values to always be in sync which is not the case when
 * there are two streams, one for curr space and one for
 * the curr org.
 */
function getCurrentOrgAndSpaceStream () {
  const currOrgAndSpaceBus = createPropertyBus([]);

  $rootScope.$on('$stateChangeSuccess', (_e, _s, {orgId}) => {
    const orgs = getValue(organizations$);
    const org =
          getOrgById(orgs, orgId) ||
          get(spaceContext, 'organizationContext.organization', null) ||
          orgs[0];
    const space = get(spaceContext, 'space.data', null);

    currOrgAndSpaceBus.set([org, space]);
  });

  return currOrgAndSpaceBus.property;
}

function getOrgById (orgs, orgId) {
  return orgId && find(orgs, org => org.sys.id === orgId);
}
