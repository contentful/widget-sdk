import LD from 'launch-darkly-client';

import {launchDarkly as config} from 'Config';
import {assign, get, isNull, omitBy} from 'lodash';
import {onValueScope, createPropertyBus} from 'utils/kefir';
import getChangesObject from 'utils/ShallowObjectDiff';
import {isOrgPlanEnterprise} from 'data/Org';
import {getEnabledFlags} from 'debug/EnforceFlags';
import {createMVar, sleep} from 'utils/Concurrent';
import logger from 'logger';

import {isExampleSpace} from 'data/ContentPreview';
import {
  getOrgRole,
  isUserOrgCreator,
  userDataBus$,
  isNonPayingUser,
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
export function init () {
  // singleton
  if (client) {
    return;
  }

  userDataBus$.onValue(changeUserContext);
}

/**
 * @usage[js]
 * const ld = require('utils/LaunchDarkly')
 *
 * let flagVariationPromise = ld.getCurrentVariation('my-test-or-feature-flag')
 * flagVariationPromise.then(doSomething)
 *
 * @description
 * This function returns a promise that resolves to the variation for the
 * provided test or feature flag name for the current context.
 *
 * Guarantees provided:
 * 1. The promise will settle only when LD is ready for the current context
 * where context is a combination of current user, org and space data.
 * 2. The promise will resolve with the variation for the provided flag name
 * if it receives a variation from it from LD.
 * 3. The promise will resolve with `undefined` if LD does not find a flag
 * with the provided flag name. An error will be logged to bugsnag.
 *
 * Note: this can also happen in rare cases even if a flag does exist (e.g. LD
 * service is down) and you should keep it in mind if your default value is not
 * falsy.
 *
 * @param {String} flagName
 * @returns {Promise<Variation>}
 */
export function getCurrentVariation (flagName) {
  return LDContextChangeMVar.read().then(_ => {
    const variation = getVariation(flagName, UNINIT_VAL);
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
 * const ld = require('utils/LaunchDarkly')
 *
 * ld.onFeatureFlag($scope, 'feature-flag', (variation, changes) => {...})
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
 * 1. The handler will always be called with the flag for your current context
 * where current context is a combination of the current user, org and space data.
 * 2. The handler will only be called once LD is properly initialized which means
 * the current context is updated to reflect values for the current state of the app.
 * State of the app here refers to current user, current org and current space.
 * 3. The handler will always be given changes in context as the second parameter
 * 4. The handler will be called with `undefined` as the variation if the flag does
 * not exist in LD or if LD itself is down.
 *
 * @param {Scope} $scope
 * @param {String} flagName
 * @param {function} variationHandler - It receives the current variation for the
 * flag as the first argument and changes in LaunchDarkly context as the second
 * argument.
 */
export function onFeatureFlag ($scope, featureName, handler) {
  // we always start property bus with some value. However, in this situation
  // we don't want to do that - we want to emit only the first actual value
  const INITIAL_PROPERTY_VALUE = '$$__INITIAL_PROPERTY_VALUE';
  const obs$ = createPropertyBus(INITIAL_PROPERTY_VALUE);
  const setVariation = getVariationSetter(featureName, obs$);

  LDContextChangeMVar.read().then(_ => {
    setVariation();
    client.on(`change:${featureName}`, setVariation);
  });

  $scope.$on('$destroy', _ => {
    obs$.end();
    if (client) {
      client.off(`change:${featureName}`, setVariation);
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
function getVariationSetter (flagName, obs$) {
  return _ => obs$.set(getVariation(flagName, UNINIT_VAL));
}


/**
 * @description
 * Wraps `client.variation()` method, overriding with `true` for feature flags
 * enabled via query params.
 *
 * @param {String} flagName - feature or test flag
 * @param {Any} defaultValue - default value to return if the flag is not found
 * @returns {Any}
 */
function getVariation (flagName, defaultValue) {
  const enabledFeatures = getEnabledFlags();
  if (enabledFeatures.indexOf(flagName) >= 0) {
    return true;
  } else {
    return client.variation(flagName, defaultValue);
  }
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
 * - isNonPayingUser : true if non of the orgs the user belongs to is paying us (supports both v1 and v2 pricing)
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
function buildLDUser (user, currOrg, spacesByOrg, currSpace, contentPreviews, publishedCTs, pricing) {
  const orgId = currOrg.sys.id;

  let customData = {
    currentOrgId: orgId,
    currentOrgSubscriptionStatus: get(currOrg, 'subscription.status'),
    currentOrgPlanIsEnterprise: isOrgPlanEnterprise(currOrg),
    currentOrgHasSpace: !!get(spacesByOrg[orgId], 'length', 0),
    currentOrgPricingVersion: currOrg.pricingVersion,

    currentUserOrgRole: getOrgRole(user, orgId),
    currentUserHasAtleastOneSpace: hasAnOrgWithSpaces(spacesByOrg),
    currentUserOwnsAtleastOneOrg: ownsAtleastOneOrg(user),
    currentUserAge: getUserAgeInDays(user), // in days
    currentUserCreationDate: getUserCreationDateUnixTimestamp(user), // unix timestamp
    currentUserIsCurrentOrgCreator: isUserOrgCreator(user, currOrg),
    currentUserSignInCount: user.signInCount,
    isNonPayingUser: isNonPayingUser(pricing),
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
function setCurrCtx (user) {
  prevCtx = currCtx;
  currCtx = assign(
    {},
    {key: user.key},
    user.anonymous ? {anonymous: user.anonymous} : {},
    user.custom);
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
function changeUserContext ([user, currOrg, spacesByOrg, currSpace, contentPreviews, publishedCTs, pricing]) {
  const ldUser = buildLDUser(user, currOrg, spacesByOrg, currSpace, contentPreviews, publishedCTs, pricing);
  setCurrCtx(ldUser);
  // FIXME We need to handle the case where the LD service is not
  // available. Unfortunately LD does not pass error information to the
  // callbacks. They are always called, no matter what.
  if (client) {
    LDContextChangeMVar.empty();

    const logResponse = startLogging('LD:client.identify');
    client.identify(ldUser, null, () => {
      logResponse();
      LDContextChangeMVar.put();
    });
  } else {
    const logResponse = startLogging('LD.initialize');
    client = LD.initialize(config.envId, ldUser);
    client.on('ready', _ => {
      logResponse();
      LDContextChangeMVar.put();
    });
  }
}

/**
 * @description we depend on LD, and we want to keep logging it's slow responses to track
 * how healthy it is
 * @param {string} methodName – LD methodName to write in the bugsnag. Essentially, there is no
 * diference between `initialize` and `identify`, but just for separation we mark them
 * @returns {function} – function which stops logging and emits bugsnag error if
 * it takes more than 1 second
 */
function startLogging (methodName) {
  // the following code tracks how long does it take to identify client with new data
  // the problem is that if we call `getCurrentVariation`, we can be stuck for some time
  // this code allows us to track in the bugsnag, in case we wait for more than 1 second
  let clientIdentified = false;
  const startingTime = Date.now();
  const groupingHash = 'LaunchDarkly user identification';

  // we track for 1, 5, 15, 30, 60 seconds and report if we were not able to identify.
  // the reason to do so – we _might_ not even reach callback, so reporting from only there
  // won't give us numbers
  // we track on so many intervals because otherwise user can close/refresh the page and we
  // won't know that they were waiting for quite a time
  [1000, 5000, 15000, 30000, 60000].forEach(ms => {
    sleep(ms).then(() => {
      if (!clientIdentified) {
        // send error to bugsnag, so we can actually evaluate
        // the impact of failures
        logger.logException(new Error(`LaunchDarkly ${methodName} is taking too long to complete`), {
          data: {
            message: `${methodName} was not completed in ${ms}ms`,
            time: ms
          },
          groupingHash
        });
      }
    });
  });

  return () => {
    const passedTime = Date.now() - startingTime;
    if (passedTime > 1000) {
      logger.logException(new Error(`LaunchDarkly ${methodName} has taken too long to complete`), {
        data: {
          message: `${methodName} was completed in ${passedTime}ms`,
          time: passedTime
        },
        groupingHash
      });
    }

    clientIdentified = true;
  };
}
