import LD from 'libs/launch-darkly-client';

import {launchDarkly as config} from 'Config';
import {assign, get, isNull, noop, omitBy} from 'lodash';
import {onValueScope, createPropertyBus} from 'utils/kefir';
import getChangesObject from 'utils/ShallowObjectDiff';

import {
  getOrgRole,
  userDataStream$,
  isNonPayingUser,
  getUserAgeInDays,
  ownsAtleastOneOrg,
  hasAnOrgWithSpaces
} from 'data/User';

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

  userDataStream$.onValue(changeUserContext);
}

/**
 * @usage[js]
 * const ld = require('utils/LaunchDarkly')
 *
 * // track all variation changes
 * ld.onFeatureFlag($scope, 'my-awesome-feature-flag', variation => doSomething())
 *
 * // track variation changes only if current org was changed
 * ld.onFeatureFlag(
 *   $scope,
 *   'another-feature-flag',
 *   variationHandler,
 *   changes => !changes.currentOrgId
 * )
 *
 * @description
 * Sets up a handler that receives the variation for the specified feature flag.
 * It tracks changes in flag variation by default. This behaviour can be overridden by providing a custom
 * ignoreChangeFn.
 *
 * @param {Scope} $scope
 * @param {String} flagName
 * @param {function} variationHandler
 * @param {function} [ignoreChangeFn = _ => false] - An optional fn that receives diff of old and curr context,
 * new variation and old variation. If it returns true, changes to the test variation are ignored and the
 * variationHandler is not called with the new variation.
 *
 */
export function onFeatureFlag ($scope, flagName, variationHandler, ignoreChangeFn = _ => false) {
  const obs$ = createPropertyBus();

  const readyHandler = _ => setVariation(flagName, obs$);

  const changeHandler = (newVariation = '""', oldVariation = '""') => {
    const changes = getChangesObject(prevCtx, currCtx);
    const parsedNewVariation = JSON.parse(newVariation);
    const parsedOldVariation = JSON.parse(oldVariation);

    if (!ignoreChangeFn(changes, parsedNewVariation, parsedOldVariation)) {
      setVariation(flagName, obs$);
    }
  };

  // ready is emitted after the called to init in changeUserContext succeeds
  client.on('ready', readyHandler);
  // change for flagName is emitted whenever LD changes the variation for
  // the given user
  client.on(`change:${flagName}`, changeHandler);

  // end the observable when scope is destroyed so that we don't leak
  // handlers for ready and change events
  $scope.$on('$destroy', _ => {
    obs$.end();
    client.off('ready', readyHandler);
    client.off(`change:${flagName}`, changeHandler);
  });

  // set the initial variation on the prop
  setVariation(flagName, obs$);

  // setup handler for variation Kefir property
  onValueScope(
    $scope,
    obs$.property
      .filter(v => v !== undefined && v !== UNINIT_VAL)
      .map(v => JSON.parse(v)),
    variationHandler
  );
}

/**
 * @usage[js]
 * const ld = require('utils/LaunchDarkly')
 *
 * // track all variation changes
 * ld.onABTest($scope, 'my-test', variation => doSomething())
 *
 * // track variation changes only if current org was changed
 * ld.onABTest(
 *   $scope,
 *   'my-test',
 *   variationHandler,
 *   changes => !changes.currentOrgId
 * )
 *
 * @description
 * Sets up handlers which are called with the variation for the specified test.
 * It DOES NOT track changes in test variation by default. This behaviour can be overridden by providing a
 * custom ignoreChangeFn.
 *
 * @param {Scope} $scope
 * @param {String} flagName
 * @param {function} variationHandler
 * @param {function} [ignoreChangeFn = _ => true] - An optional fn that receives diff of old and curr context,
 * new variation and old variation. If it returns true, changes to the test variation are ignored and the
 * variationHandler is not called with the new variation.
 *
 */
export function onABTest ($scope, testName, variationHandler, ignoreChangeFn = _ => true) {
  onFeatureFlag($scope, testName, variationHandler, ignoreChangeFn);
}

/**
 * @description
 * Emit a variation on a given observable
 *
 * @param {String} flagName
 * @param {utils/Kefir.property<Variation>} obs$
 */
function setVariation (flagName, obs$) {
  const variation = client.variation(flagName, UNINIT_VAL);

  obs$.set(variation);
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
    currentOrgHasSpace: !!get(spacesByOrg[orgId], 'length', 0),
    currentUserOrgRole: getOrgRole(user, orgId),
    currentUserHasAtleastOneSpace: hasAnOrgWithSpaces(spacesByOrg),
    currentUserOwnsAtleastOneOrg: ownsAtleastOneOrg(user),
    currentUserAge: getUserAgeInDays(user), // in days
    isNonPayingUser: isNonPayingUser(user)
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
  setCurrCtx(user);
  client.identify(user, null, noop);
}

/**
 * @description
 * A handler meant for the userDataStream$ which, based on the user
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
  } else {
    identify(newLDUser);
  }
}
