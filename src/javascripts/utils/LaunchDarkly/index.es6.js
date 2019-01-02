import LD from 'ldclient-js';

import { launchDarkly as config } from 'Config.es6';
import { assign, get, isNull, omitBy } from 'lodash';
import { onValueScope, createPropertyBus } from 'utils/kefir.es6';
import getChangesObject from 'utils/ShallowObjectDiff.es6';
import { isFlagOverridden, getFlagOverride } from 'debug/EnforceFlags.es6';
import { createMVar } from 'utils/Concurrent.es6';
import logger from 'logger';

import { isExampleSpace } from 'data/ContentPreview';
import {
  getOrgRole,
  isUserOrgCreator,
  userDataBus$,
  getUserAgeInDays,
  ownsAtleastOneOrg,
  hasAnOrgWithSpaces,
  isAutomationTestUser,
  getUserSpaceRoles,
  getUserCreationDateUnixTimestamp
} from 'data/User';

// mvar to wait until LD context is successfully switched
const LDContextChangeMVar = createMVar();

const UNINIT_VAL = undefined;

let client, prevCtx, currCtx;

/**
 * @usage[js]
 * require('utils/LaunchDarkly').init()
 *
 * @description
 * Initializes a LaunchDarkly client.
 */
export function init() {
  // singleton
  if (client) {
    return;
  }

  userDataBus$.onValue(changeUserContext);
}

/**
 * @usage[js]
 * import { getCurrentVariation } from 'utils/LaunchDarkly'
 *
 * const variation  = await getCurrentVariation('my-test-or-feature-flag')
 *
 * @description
 * This function returns a promise that resolves to the variation for the
 * provided test or feature flag name for the current context. If the flag name
 * is overridden, then a promise that resolves to the overridden value is returned.
 * NOTE: a flag's value can be overridden using ui_(enable|disable)_flags query param.
 *
 * Guarantees provided:
 * 1. If flag is overridden
 *   1. The promise returned will resolve to the overridden value of the flag
 * 2. If the flag is NOT overridden
 *   1. The promise will settle only when LD is ready for the current context
 *      where context is a combination of current user, org and space data.
 *   2. The promise will resolve with the variation for the provided flag name
 *      if it receives a variation from it from LD.
 *   3. The promise will resolve with `undefined` if LD does not find a flag
 *      with the provided flag name. An error will be logged to bugsnag.
 *
 *      NOTE: this can also happen in rare cases even if a flag does exist (e.g. LD
 *      service is down) and you should keep it in mind if your default value is not
 *      falsy.
 *
 * @param {String} flagName
 * @returns {Promise<Variation>}
 */
export function getCurrentVariation(flagName) {
  /**
   * if the flag is overridden, don't wait to
   * connect to LD before returning the overridden
   * variation.
   */
  if (isFlagOverridden(flagName)) {
    return Promise.resolve(getFlagOverride(flagName));
  }

  return LDContextChangeMVar.read().then(_ => {
    const variation = client.variation(flagName, UNINIT_VAL);
    if (variation === UNINIT_VAL) {
      // LD could not find a flag with given name, log error and return undefined
      logger.logError(`Invalid flag ${flagName}`);
      return UNINIT_VAL;
    } else {
      return JSON.parse(variation);
    }
  });
}

/**
 * @usage[js]
 * import { onFeatureFlag } from 'utils/LaunchDarkly'
 *
 * onFeatureFlag($scope, 'feature-flag', (variation, changes) => {...})
 *
 * @description
 * Sets up a handler that receives the variation for the specified feature flag.
 * It tracks changes in variation for the specified flag and passes them to the
 * handler provided along with the changes in current LaunchDarkly context.
 * The changes in context are made available to the consumer so that they can
 * make a smart decision on what they want to do with the variation the handler
 * received.
 *
 * Guarantees provided:
 * 1. If the flag is overridden
 *   1. The handler will only ever be called once with the overridden value for the
 *      provided flag. The changes object passed to the handler will be `{}`
 * 2. If the flag is NOT overridden
 *   1. The handler will always be called with the flag for your current context
 *      where current context is a combination of the current user, org and space data.
 *   2. The handler will only be called once LD is properly initialized which means
 *      the current context is updated to reflect values for the current state of the app.
 *      State of the app here refers to current user, current org and current space.
 *   3. The handler will always be given changes in context as the second parameter
 *   4. The handler will be called with `undefined` as the variation if the flag does
 *      not exist in LD or if LD itself is down.
 *
 * @param {Scope} $scope
 * @param {String} flagName
 * @param {function} variationHandler - It receives the current variation for the
 * flag as the first argument and changes in LaunchDarkly context as the second
 * argument.
 */
export function onFeatureFlag($scope, flagName, handler) {
  if (isFlagOverridden(flagName)) {
    const variation = getFlagOverride(flagName);
    const obs$ = createPropertyBus(variation);

    onValueScope(
      $scope,
      obs$.property.map(v => [
        v, // overridden value is a JS boolean so no need to parse
        {} // no context change will be emitted as the flag value is forced
      ]),
      ([variation, changes]) => handler(variation, changes)
    );
  } else {
    // we always start property bus with some value. However, in this situation
    // we don't want to do that - we want to emit only the first actual value
    const INITIAL_PROPERTY_VALUE = '$$__INITIAL_PROPERTY_VALUE';
    const obs$ = createPropertyBus(INITIAL_PROPERTY_VALUE);
    const setVariation = getVariationSetter(flagName, obs$);

    LDContextChangeMVar.read().then(_ => {
      setVariation();
      client.on(`change:${flagName}`, setVariation);
    });

    $scope.$on('$destroy', _ => {
      obs$.end();
      if (client) {
        client.off(`change:${flagName}`, setVariation);
      }
    });

    onValueScope(
      $scope,
      obs$.property
        .filter(v => v !== INITIAL_PROPERTY_VALUE)
        .map(v => [v === undefined ? v : JSON.parse(v), getChangesObject(prevCtx, currCtx)]),
      ([variation, changes]) => handler(variation, changes)
    );
  }
}

export { onFeatureFlag as onABTest };

/**
 * @description
 * Returns a fn which sets the current variation for the
 * given feature flag or test flag.
 *
 * @param {String} flagName - feature or test flag
 * @param {utils/Kefir.property<Variation>} obs$
 * @returns {Function}
 */
function getVariationSetter(flagName, obs$) {
  return _ => obs$.set(client.variation(flagName, UNINIT_VAL));
}

/**
 * @description
 * Builds a launch darkly user with custom data to help us
 * target users.
 * Custom attributes that can be used in targeting users:
 * - currentOrgId : current org in the app the user is in the context of
 * - currentOrgSubscriptionStatus : one of free, paid, free_paid, trial
 * - currentOrgPlanIsEnterprise : true if the current org is on an enterprise plan
 * - currentOrgHasSpace : true if the current org has a space
 * - currentOrgPricingVersion : the current organization pricing version, currently either `pricing_version_1` or `pricing_version_2`

 * - currentUserOrgRole : user's role in current org
 * - currentUserHasAtleastOneSpace : true if the user has atleast one space in all the orgs he/she is a member of
 * - currentUserOwnsAtleastOneOrg : true if the user is the owner of atleast one org
 * - currentUserAge : days since user signed up
 * - currentUserCreationDate: current user creation date as a unix timestamp (generated by moment and not the same as Date.now())
 * - currentUserIsCurrentOrgCreator : true if the current org was created by the current user
 * - currentUserSignInCount : count of the number of times the current user has signed in
 * - isNonPayingUser : true if non of the orgs the user belongs to is paying us
 * - currentSpaceId : id of the space the user is in
 * - currentUserSpaceRole : list of lower case roles that user has for current space
 * - isAutomationTestUser : true if the current user was created by the automation suite
 * - isExampleSpace : true if the current space is identified as an example space. Look into the function for it for the logic
 *
 * @param {Object} user
 * @param {Object} currOrg
 * @param {Object} spacesByOrg
 * @param {Object} currSpace
 *
 * @returns {Object} customData
 */
function buildLDUser(
  user,
  currOrg,
  spacesByOrg,
  currSpace,
  contentPreviews,
  publishedCTs,
  organizationStatus
) {
  const orgId = currOrg.sys.id;

  let customData = {
    currentOrgId: orgId,
    currentOrgSubscriptionStatus: get(currOrg, 'subscription.status'),
    currentOrgPlanIsEnterprise: get(organizationStatus, ['isEnterprise'], false),
    currentOrgHasSpace: !!get(spacesByOrg[orgId], 'length', 0),
    currentOrgPricingVersion: currOrg.pricingVersion,

    currentUserOrgRole: getOrgRole(user, orgId),
    currentUserHasAtleastOneSpace: hasAnOrgWithSpaces(spacesByOrg),
    currentUserOwnsAtleastOneOrg: ownsAtleastOneOrg(user),
    currentUserAge: getUserAgeInDays(user), // in days
    currentUserCreationDate: getUserCreationDateUnixTimestamp(user), // unix timestamp
    currentUserIsCurrentOrgCreator: isUserOrgCreator(user, currOrg),
    currentUserSignInCount: user.signInCount,
    isNonPayingUser: !get(organizationStatus, ['isPaid'], false),
    // by default, if there is no current space, we pass empty array
    currentUserSpaceRole: [],
    isAutomationTestUser: isAutomationTestUser(user),
    isExampleSpace: isExampleSpace(contentPreviews, publishedCTs)
  };

  if (currSpace) {
    const roles = getUserSpaceRoles(currSpace);
    customData = assign({}, customData, {
      currentSpaceId: currSpace.sys.id,
      currentUserSpaceRole: roles
    });
  }

  // remove all custom props that are null and return the obj
  return {
    key: user.sys.id,
    custom: omitBy(customData, isNull)
  };
}

/**
 * @description
 * Sets up the current and previous contexts based on the users sent to LaunchDarkly
 *
 * @param {Object} user - An LD user with a key and custom properties
 */
function setCurrCtx(user) {
  prevCtx = currCtx;
  currCtx = assign(
    {},
    { key: user.key },
    user.anonymous ? { anonymous: user.anonymous } : {},
    user.custom
  );
}

/**
 * @description
 * A handler meant for the userDataBus$ which, based on the user
 * and the current app states, either initializes an LD client
 * or switches user context.
 *
 * @param {Array} arr - An array containing a contentful user, current org
 * a map of spaces by org id and an optional current space
 */
function changeUserContext([
  user,
  currOrg,
  spacesByOrg,
  currSpace,
  contentPreviews,
  publishedCTs,
  organizationStatus
]) {
  const ldUser = buildLDUser(
    user,
    currOrg,
    spacesByOrg,
    currSpace,
    contentPreviews,
    publishedCTs,
    organizationStatus
  );
  setCurrCtx(ldUser);
  // FIXME We need to handle the case where the LD service is not
  // available. Unfortunately LD does not pass error information to the
  // callbacks. They are always called, no matter what.
  if (client) {
    LDContextChangeMVar.empty();

    client.identify(ldUser, null, LDContextChangeMVar.put);
  } else {
    client = LD.initialize(config.envId, ldUser);
    client.on('ready', LDContextChangeMVar.put);
  }
}
