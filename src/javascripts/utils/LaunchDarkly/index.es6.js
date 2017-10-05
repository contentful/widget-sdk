import LD from 'libs/launch-darkly-client';

import {assign, get, noop} from 'lodash';
import {launchDarkly as config} from 'Config';
import {hasAnOrgWithSpaces, ownsAtleastOneOrg} from 'components/shared/auto_create_new_space';

import {
  getUserAgeInDays,
  getOrgRole,
  getChangesObject,
  isNonPayingUser,
  userDataStream$
} from './utils';

import {
  onValueScope,
  createPropertyBus
} from 'utils/kefir';


const UNINIT_VAL = '<UNINITIALIZED>';
let client, prevCtx, currCtx;

/**
 * @name utils/LaunchDarkly#init
 *
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

  const setCurrCtx = user => {
    prevCtx = currCtx;
    currCtx = assign(
      {},
      {key: user.key},
      user.anonymous ? {anonymous: user.anonymous} : {},
      user.custom);
  };

  const initLDClient = user => {
    setCurrCtx(user);
    return LD.initialize(config.envId, user);
  };

  const identify = user => {
    setCurrCtx(user);
    client.identify(user, null, noop);
  };

  const changeUserContext = ([user, currOrg, spacesByOrg, currSpace]) => {
    const orgId = currOrg.sys.id;
    let customData = {
      currentOrgId: orgId,
      currentOrgSubscriptionStatus: currOrg.subscription.status,
      currentOrgHasSpace: !!get(spacesByOrg[orgId], 'length', 0),
      currentUserOrgRole: getOrgRole(user.organizationMemberships, orgId),
      currentUserHasAtleastOneSpace: hasAnOrgWithSpaces(spacesByOrg),
      currentUserOwnsAtleastOneOrg: ownsAtleastOneOrg(user),
      currentUserAge: getUserAgeInDays(user.sys.createdAt), // in days
      isNonPayingUser: isNonPayingUser(user)
    };

    if (currSpace) {
      customData = assign({}, customData, {
        currentSpaceId: currSpace.sys.id
      });
    }

    const newLDUser = {
      key: user.sys.id,
      custom: customData
    };

    if (!client) {
      client = initLDClient(newLDUser);
    } else {
      identify(newLDUser);
    }
  };

  userDataStream$.onValue(changeUserContext);
}

/**
 * @name utils/LaunchDarkly#onFeatureFlag
 *
 * @usage[js]
 * const ld = require('utils/LaunchDarkly')
 *
 * // track all variation changes
 * const awesomeFeatureFlag$ = ld.onFeatureFlag($scope, 'my-awesome-feature-flag', variation => doSomething())
 *
 * // track variation changes only if current org was changed
 * const awesomeFeatureFlag$ = ld.onFeatureFlag(
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

  const changeHandler = (newVariation, oldVariation) => {
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
 * @name utils/LaunchDarkly#onABTest
 *
 * @usage[js]
 * const ld = require('utils/LaunchDarkly')
 *
 * // track all variation changes
 * const awesomeFeatureFlag$ = ld.onABTest($scope, 'my-test', variation => doSomething())
 *
 * // track variation changes only if current org was changed
 * const awesomeFeatureFlag$ = ld.onABTest(
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
 * @name setVariation
 *
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
