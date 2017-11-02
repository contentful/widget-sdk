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
 * 3. The promise will reject if LD did not find any flag with the provided
 * flag name
 *
 * @param {String} flagName
 * @returns {Promise<Variation>}
 */
export function getCurrentVariation (flagName) {
  return LDContextChangeMVar.read().then(_ => {
    const variation = getVariation(flagName, UNINIT_VAL);

    if (variation === UNINIT_VAL) {
      throw new Error(`Invalid flag ${flagName}`);
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
  return _ => obs$.set(getVariation(flagName, UNINIT_VAL));
}


/**
 * @description
 * Wraps `client.variation()` method, overriding with `true` for feature flags
 * enabled via query params.
 */
function getVariation (flagName, ...args) {
  const enabledFeatures = getEnabledFeatures();
  if (enabledFeatures.indexOf(flagName) >= 0) {
    return 'true';
  } else {
    return client.variation(flagName, ...args);
  }
}

/**
 * @description
 * Builds a launch darkly user with custom data to help us
 * target users.
 * Custom data that can be used in targeting users:
 * - currentOrgId : current org in the app the user is in the context of
 * - currentOrgSubscriptionStatus : one of free, paid, free_paid, trial
 * - currentOrgPlanIsEnterprise : true if the current org is on an enterprise plan
 * - currentOrgHasSpace : true if the current org has a space
 * - currentUserOrgRole : user's role in current org
 * - currentUserHasAtleastOneSpace : true if the user has atleast one space in all the orgs he/she is a member of
 * - currentUserOwnsAtleastOneOrg : true if the user is the owner of atleast one org
 * - currentUserAge : days since user signed up
 * - isNonPayingUser : true if non of the orgs the user belongs to is paying us
 * - isAutomationTestUser : true if the current user was created by the automation suite
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
    isAutomationTestUser: isAutomationTestUser(user)
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
      LDContextChangeMVar.put();
    });
  } else {
    identify(newLDUser);
  }
}
