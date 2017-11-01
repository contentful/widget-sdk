import LD from 'libs/launch-darkly-client';

import {launchDarkly as config} from 'Config';
import {assign, get, isNull, omitBy} from 'lodash';
import {onValueScope, createPropertyBus} from 'utils/kefir';
import getChangesObject from 'utils/ShallowObjectDiff';
import {isOrgPlanEnterprise} from 'data/Org';
import {getEnabledFeatures} from 'utils/LaunchDarkly/EnforceFeatureFlags';

import {
  getOrgRole,
  userDataBus$,
  isNonPayingUser,
  getUserAgeInDays,
  ownsAtleastOneOrg,
  hasAnOrgWithSpaces,
  isAutomationTestUser
} from 'data/User';

import createMVar from 'utils/Concurrent/MVar';

// mvar to wait until `ready` event by LD was fired
// it allows us to implement one-time subscription
const LDInitMVar = createMVar();

// mvar to wait until LD context is successfully switched
const LDContextChangeMVar = createMVar();

const UNINIT_VAL = '<UNINITIALIZED>';
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
 * // it should be used only outside of the directive controller
 * let testFlagVariationPromise = ld.onABTestOnce('my-test')
 * // inside controller body
 * testFlagVariationPromise.then(setupTest)
 *
 * @description
 * This is a special function, in that it is meant to give you only the
 * first variation it receives for your user and test flag combination
 * between app refreshes.
 * This is achieved by using this function only outside of the controller
 * body as shown in the usage example above. It does not track changes in
 * variation for the flag and guarantees that the promise will only settle
 * once for every app load. This makes it suitable for usage in A/B testing
 * where we don't want the test to disappear from under the user's feet due
 * to changes in the LaunchDarkly caused by some user action for example,
 * new space creation.
 *
 * Guarantees provided:
 * 1. The promise will settle only when LD is initialized for the current
 * context where context is a combination of current user, org and space data.
 * 2. The promise will resolve with the variation for the provided test name
 * if it receives a variation from it from LD.
 * 3. The promise will reject if LD did not find any test with the provided
 * test name
 *
 * @param {String} testName
 * @returns {Promise<Variation>}
 */
export function onABTestOnce (testName) {
  return LDInitMVar.read().then(_ => {
    const variation = client.variation(testName, UNINIT_VAL);

    if (variation === UNINIT_VAL) {
      throw new Error(`Invalid test flag ${testName}`);
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
 * 4. The handler will _never_ be called with undefined as an argument
 *
 * @param {Scope} $scope
 * @param {String} flagName
 * @param {function} variationHandler - It receives the current variation for the
 * flag as the first argument and changes in LaunchDarkly context as the second
 * argument.
 */
export function onFeatureFlag ($scope, featureName, handler) {
  const obs$ = createPropertyBus();
  const setVariation = getVariationSetter(featureName, obs$);

  LDContextChangeMVar.read().then(_ => {
    setVariation();
    client.on(`change:${featureName}`, setVariation);
  });

  $scope.$on('$destroy', _ => {
    obs$.end();
    client.off(`change:${featureName}`, setVariation);
  });

  onValueScope(
    $scope,
    obs$.property
      .filter(v => v !== undefined && v !== UNINIT_VAL)
      .map(v => [JSON.parse(v), getChangesObject(prevCtx, currCtx)]),
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
  return _ => obs$.set(client.variation(flagName, UNINIT_VAL));
}

/**
 * @description
 * Builds a launch darkly user with custom data to help us
 * target users.
 *
 * @param {Object} user
 * @param {Object} currOrg
 * @param {Object} spacesByOrg
 * @param {Object} currSpace
 *
 * @returns {Object} customData
 */
function buildLDUser (user, currOrg, spacesByOrg, currSpace) {
  const orgId = currOrg.sys.id;
  let customData = {
    currentOrgId: orgId,
    currentOrgSubscriptionStatus: currOrg.subscription.status,
    currentOrgPlanIsEnterprise: isOrgPlanEnterprise(currOrg),
    currentOrgHasSpace: !!get(spacesByOrg[orgId], 'length', 0),
    currentUserOrgRole: getOrgRole(user, orgId),
    currentUserHasAtleastOneSpace: hasAnOrgWithSpaces(spacesByOrg),
    currentUserOwnsAtleastOneOrg: ownsAtleastOneOrg(user),
    currentUserAge: getUserAgeInDays(user), // in days
    isNonPayingUser: isNonPayingUser(user),
    isAutomationTestUser: isAutomationTestUser(user),
    enabledFeatures: getEnabledFeatures()
  };

  if (currSpace) {
    customData = assign({}, customData, {
      currentSpaceId: currSpace.sys.id
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
 * Initializes the LD client
 *
 * @param {Object} user - An LD user with a key and custom properties
 */
function initLDClient (user) {
  setCurrCtx(user);
  return LD.initialize(config.envId, user);
}

/**
 * @description
 * Changes the user context which could either be the complete user
 * or just some custom properties.
 *
 * @param {Object} user - An LD user with a key and custom properties
 */
function identify (user) {
  LDContextChangeMVar.empty();
  setCurrCtx(user);
  client.identify(user, null, LDContextChangeMVar.put);
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
function changeUserContext ([user, currOrg, spacesByOrg, currSpace]) {
  const newLDUser = buildLDUser(user, currOrg, spacesByOrg, currSpace);

  if (!client) {
    client = initLDClient(newLDUser);
    client.on('ready', _ => {
      LDInitMVar.put();
      LDContextChangeMVar.put();
    });
  } else {
    identify(newLDUser);
  }
}
