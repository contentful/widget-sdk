import moment from 'moment';
import { isEqual, find, get } from 'lodash';
import { organizations$, user$, spacesByOrganization$ } from 'services/TokenStore';

import { combine, onValue, getValue, createPropertyBus } from 'utils/kefir';
import { getModule } from 'NgRegistry';

/**
 * @description
 * A stream combining user, current org, current space and spaces grouped by org id
 */
export const getUserDataBus = () =>
  combine(
    [user$, getCurrentOrgSpaceBus(), spacesByOrganization$],
    (user, [org, space], spacesByOrg) => [user, org, spacesByOrg, space]
  )
    .filter(([user, org, spacesByOrg]) => user && user.email && org && spacesByOrg) // space is a maybe
    .skipDuplicates(isEqual)
    .toProperty();

/**
 * @description
 * Get the user role for a given org id
 *
 * @param {Object<User>} user
 * @param {String} orgId
 * @returns {string?} orgRole
 */
export function getOrgRole(user, orgId) {
  const orgMemberships = user.organizationMemberships;
  const org = find(
    orgMemberships,
    ({
      organization: {
        sys: { id },
      },
    }) => orgId === id
  );
  const role = org && org.role;

  return role || null;
}

/**
 * @description
 * Get the user's age in days (age = now - createdAt in days)
 *
 * @param {object} user
 * @returns {Number} user age
 */
export function getUserAgeInDays(user) {
  const creationDate = moment(user.sys.createdAt);
  const now = moment();

  return now.diff(creationDate, 'days');
}

/**
 * @description
 * Get the user's creation date as a unix timestamp
 *
 * @param  {object} user
 *
 * @returns {Number} unix timestamp
 */
export function getUserCreationDateUnixTimestamp(user) {
  return moment(user.sys.createdAt).unix();
}

/**
 * @description
 * Returns true if the user belongs to an org that has atleast one space
 *
 * @param {Object} spacesByOrg
 * @returns {boolean}
 */
export function hasAnOrgWithSpaces(spacesByOrg) {
  return !!find(spacesByOrg, (spaces) => !!spaces.length);
}

/**
 * @description
 * Returns true if the user owns atleast one org that he/she is a
 * member of.
 *
 * @param {Object} user
 * @returns {boolean}
 */
export function ownsAtleastOneOrg(user) {
  return !!getOwnedOrgs(user).length;
}

/**
 * @description
 * Returns a list of orgs owned by the give user
 *
 * @param {Object} user
 * @returns {Array<User>}
 */
export function getOwnedOrgs(user) {
  const orgMemberships = user.organizationMemberships || [];
  // filter out orgs user owns
  return orgMemberships.filter((org) => org.role === 'owner');
}

/**
 * @description
 * Returns the first org that it finds which is owner by the user
 *
 * @param {Object} user
 * @param {Object} spacesByOrg
 * @returns {Object<Org>?}
 */
export function getFirstOwnedOrgWithoutSpaces(user, spacesByOrg) {
  const ownedOrgs = getOwnedOrgs(user);
  // return the first org that has no spaces
  const orgMembership = find(ownedOrgs, (ownedOrg) => {
    const spacesForOrg = spacesByOrg[ownedOrg.organization.sys.id];

    return !spacesForOrg || spacesForOrg.length === 0;
  });

  return orgMembership && orgMembership.organization;
}

/**
 * @description
 * Returns true if the current user email matches the usual
 * automation test user email pattern. This information is sent to
 * LD so that we can filter out automation users and not break
 * automated tests with A/B tests.
 *
 * @param {Object} user
 * @returns {boolean}
 */
export function isAutomationTestUser(user) {
  return /^autotest\+.*@contentful.com$/.test(user.email);
}

/**
 * @description
 * Returns true if the given org was created by the given user.
 * This can be used as a proxy for the "contentful pioneer user"
 * in that org.
 *
 * @params {Object} user
 * @params {Object} org
 * @returns {boolean}
 */
export function isUserOrgCreator(user, org) {
  if (!org || !org.sys) throw new Error('Expected org to be an object');
  if (!user || !user.sys) throw new Error('Expected user to be an object');
  const creatorUser = org.sys.createdBy;
  return !!creatorUser && creatorUser.sys.id === user.sys.id;
}

/**
 * @description returns array of custom roles for the space
 * These roles are string values, and are good enough for
 * non-enterprise users, since they can't add new roles
 *
 * @param {Object} space
 * @returns {string[]}
 */
export function getUserSpaceRoles(space) {
  const adminRole = space.spaceMember.admin ? ['admin'] : [];
  // we keep everything lower-case, just to avoid possible naming issues
  const nonAdminRoles = space.spaceMember.roles.map(({ name }) => name && name.toLowerCase());
  return adminRole.concat(nonAdminRoles);
}

/**
 * Implemented together since we want the org and space
 * values to always be in sync which is not the case when
 * there are two streams, one for curr space and one for
 * the curr org.
 */
function getCurrentOrgSpaceBus() {
  const $rootScope = getModule('$rootScope');

  const currOrgSpaceBus = createPropertyBus([]);
  const currOrgSpaceUpdater = updateCurrOrgSpace(currOrgSpaceBus);

  // emit when orgs stream emits
  onValue(
    organizations$.filter((orgs) => orgs && orgs.length),
    currOrgSpaceUpdater
  );
  // emit when ever state changes (for e.g., space was changed)
  $rootScope.$on('$stateChangeSuccess', currOrgSpaceUpdater);

  return currOrgSpaceBus.property;
}

function updateCurrOrgSpace(bus) {
  const $stateParams = getModule('$stateParams');

  return (_) => {
    const orgId = $stateParams.orgId;
    const orgs = getValue(organizations$);
    const org = getCurrOrg(orgs, orgId);
    const space = getCurrSpace();
    bus.set([org, space]);
  };
}

/**
 * @description
 * Get the current organization the user is in the context of. Returns null if
 * the user is not currently in any organization.
 *
 * @param {Array<Object>} orgs
 * @param {string} orgId
 *
 * @return {Object|null} org
 */
export function getCurrOrg(orgs, orgId) {
  const spaceContext = getModule('spaceContext');

  return getOrgById(orgs, orgId) || get(spaceContext, ['organization'], null) || orgs[0] || null;
}

function getCurrSpace() {
  const spaceContext = getModule('spaceContext');

  return get(spaceContext, 'space.data', null);
}

function getOrgById(orgs, orgId) {
  return orgId && find(orgs, (org) => org.sys.id === orgId);
}
