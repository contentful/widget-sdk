import moment from 'moment';
import $rootScope from '$rootScope';
import $stateParams from '$stateParams';
import spaceContext from 'spaceContext';

import { contentPreviewsBus$ } from 'contentPreview';
import {isEqual, find, get} from 'lodash';
import {organizations$, user$, spacesByOrganization$} from 'services/TokenStore';

import {
  combine,
  onValue,
  getValue,
  createPropertyBus,
  fromPromise as KefirFromPromise
} from 'utils/kefir';

import {createOrganizationEndpoint} from 'data/EndpointFactory';
import {getSubscriptionPlans} from 'account/pricing/PricingDataProvider';

// currently all pricing info depends solely on the user$ stream
// we pack all info relevant to pricing to this stream
// so that you can read from it and decide qualification criteria
const pricing$ = user$
  .filter(user => user && user.organizationMemberships)
  .flatMap(user => {
    const pricingPromise = user.organizationMemberships
      .map(({ organization }) => {
        // we better use `utils/ResourceUtils`, but we'd have to break circular references
        // for simplicity, it is currently inlined
        const isNewPricing = organization.pricingVersion === 'pricing_version_2';

        if (isNewPricing) {
          const endpoint = createOrganizationEndpoint(organization.sys.id);
          // this endpoint will return all paid spaces
          return getSubscriptionPlans(endpoint, {
            plan_type: 'space'
          }).then(plans => ({ version: 'v2', plans, organization }));
        } else {
          // in legacy pricing, info within organization is enough to decide
          return Promise.resolve({ version: 'v1', organization });
        }
      });

    return KefirFromPromise(Promise.all(pricingPromise));
  });

/**
 * @description
 * A stream combining user, current org, current space and spaces grouped by org id
 */
export const userDataBus$ =
  combine(
    [
      user$,
      getCurrentOrgSpaceAndPublishedCTsBus(),
      spacesByOrganization$,
      contentPreviewsBus$,
      pricing$
    ],
    (user, [org, space, publishedCTs], spacesByOrg, contentPreviews, pricing) => [user, org, spacesByOrg, space, contentPreviews, publishedCTs, pricing]
  )
  // space is a Maybe and so is contentPreviews
  .filter(([user, org, spacesByOrg, _space, _contentPreviews, _publishedCTs, pricing]) =>
    user && user.email && org && spacesByOrg && pricing && pricing.length > 0
  )
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
export function getOrgRole (user, orgId) {
  const orgMemberships = user.organizationMemberships;
  const org = find(orgMemberships, ({organization: {sys: {id}}}) => orgId === id);
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
export function getUserAgeInDays (user) {
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
export function getUserCreationDateUnixTimestamp (user) {
  return moment(user.sys.createdAt).unix();
}

/**
 * @description
 * Given a pricing array, this returns true if none of the orgs that the user
 * belongs to is a paying org.
 * Return true if the user belongs to NO paying orgs
 * Supports both v1/v2 pricing
 *
 * @param {Object} pricing
 * @returns {boolean}
 */
export function isNonPayingUser (pricing) {
  const convertedStatuses = ['paid', 'free_paid'];
  const isPaying = pricing.some(({ version, plans, organization }) => {
    // this is not yet spec-ed, but it was communicated that if we get any items in the
    // response, we can safely assume they have paid spaces – ping @jolyon if any questions
    if (version === 'v2') {
      return plans && plans.items && plans.items.length > 0;
    }

    const orgStatus = get(organization, 'subscription.status');
    return convertedStatuses.includes(orgStatus);
  });

  return !isPaying;
}

/**
 * @description
 * Returns true if the user belongs to an org that has atleast one space
 *
 * @param {Object} spacesByOrg
 * @returns {boolean}
 */
export function hasAnOrgWithSpaces (spacesByOrg) {
  return !!find(spacesByOrg, spaces => !!spaces.length);
}

/**
 * @description
 * Returns true if the user owns atleast one org that he/she is a
 * member of.
 *
 * @param {Object} user
 * @returns {boolean}
 */
export function ownsAtleastOneOrg (user) {
  return !!getOwnedOrgs(user).length;
}

/**
 * @description
 * Returns a list of orgs owned by the give user
 *
 * @param {Object} user
 * @returns {Array<User>}
 */
export function getOwnedOrgs (user) {
  const orgMemberships = user.organizationMemberships || [];
  // filter out orgs user owns
  return orgMemberships.filter(org => org.role === 'owner');
}

/**
 * @description
 * Returns the first org that it finds which is owner by the user
 *
 * @param {Object} user
 * @param {Object} spacesByOrg
 * @returns {Object<Org>?}
 */
export function getFirstOwnedOrgWithoutSpaces (user, spacesByOrg) {
  const ownedOrgs = getOwnedOrgs(user);
  // return the first org that has no spaces
  const orgMembership = find(ownedOrgs, ownedOrg => {
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
export function isAutomationTestUser (user) {
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
export function isUserOrgCreator (user, org) {
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
export function getUserSpaceRoles (space) {
  const adminRole = space.spaceMembership.admin ? ['admin'] : [];
  // we keep everything lower-case, just to avoid possible naming issues
  const nonAdminRoles = space.spaceMembership.roles.map(
    ({ name }) => name && name.toLowerCase()
  );
  return adminRole.concat(nonAdminRoles);
}

/**
 * Implemented together since we want the org and space
 * values to always be in sync which is not the case when
 * there are two streams, one for curr space and one for
 * the curr org.
 */
function getCurrentOrgSpaceAndPublishedCTsBus () {
  const currOrgSpaceAndPublishedCTsBus = createPropertyBus([]);
  const currOrgSpaceAndPublishedCTsUpdater = updateCurrOrgSpaceAndPublishedCTs(currOrgSpaceAndPublishedCTsBus);

  // emit when orgs stream emits
  onValue(organizations$.filter(orgs => orgs && orgs.length), currOrgSpaceAndPublishedCTsUpdater);
  // emit when ever state changes (for e.g., space was changed)
  $rootScope.$on('$stateChangeSuccess', currOrgSpaceAndPublishedCTsUpdater);
  // emit when publishedCTs.items$ emits
  onValue(spaceContext.publishedCTs.items$, currOrgSpaceAndPublishedCTsUpdater);

  return currOrgSpaceAndPublishedCTsBus.property;
}

function updateCurrOrgSpaceAndPublishedCTs (bus) {
  return _ => {
    const orgId = $stateParams.orgId;
    const orgs = getValue(organizations$);
    const org = getCurrOrg(orgs, orgId);
    const space = getCurrSpace();
    const publishedCTs = getValue(spaceContext.publishedCTs.items$);

    bus.set([org, space, publishedCTs]);
  };
}

function getCurrOrg (orgs, orgId) {
  return getOrgById(orgs, orgId) ||
    get(spaceContext, 'organizationContext.organization', null) ||
    orgs[0];
}

function getCurrSpace () {
  return get(spaceContext, 'space.data', null);
}

function getOrgById (orgs, orgId) {
  return orgId && find(orgs, org => org.sys.id === orgId);
}
