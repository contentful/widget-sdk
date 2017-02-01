import { createPropertyBus } from 'utils/kefir';
import LD from 'libs/launch-darkly-client';
import { curry, forEach, remove, noop } from 'lodash';
import { settings } from 'environment';
import { user$ } from 'tokenStore';

let client;
const featureFlagToPropBusesMap = {};
const DEFAULT_VAL = null;

/**
 * @ngdoc method
 * @name utils/LaunchDarkly#init
 * @usage[js]
 * require('utils/LaunchDarkly').init({ key: <unique id> })
 *
 * @description
 * Initialize a LaunchDarkly client.
 *
 * @param {Id} anonUserId - A unique user id
 */
export function init (anonUserId) {
  // singleton
  if (client) {
    return;
  }

  const defaultAnonUser = {
    key: anonUserId,
    anonymous: true
  };

  client = LD.initialize(settings.launchDarkly.envId, defaultAnonUser, {
    bootstrap: 'localStorage'
  });

  // since get(featureFlagName) always returns immediately, it might
  // return a stale value. This makes sure that all requested
  // variations/feature flags get their actual values once
  // LaunchDarkly has completed initialization.
  client.on('ready', () => {
    forEach(featureFlagToPropBusesMap, (propBuses, featureFlag) => {
      forEach(propBuses, propBus => {
        propBus.set(client.variation(featureFlag, DEFAULT_VAL));
      });
    });
  });

  const changeUserContext = user => {
    client.identify({ key: user.email }, null, noop);
  };

  const isValidUser = user => user && user.email;

  user$
    .filter(isValidUser)
    .onValue(changeUserContext);
}

/**
 * @ngdoc method
 * @name utils/LaunchDarkly#get
 * @usage[js]
 * const ld = require('utils/LaunchDarkly')
 * ld.get($scope, 'my-awesome-feature')
 * // or
 * const getFlagVal = ld.get($scope)
 * const awesomeFeature$ = getFlagVal('my-awesome-feature')
 * awesomeFeature$.onValue(console.log.bind(console, 'val for my-awesome-feature:'))
 *
 * @description
 * Fetches the value for the requested feature flag. It accepts angular scope
 * object and the name of the feature flag that you want. It returns a kefir
 * property bus. This bus is a kefir property and will give you the latest
 * value for the feature flag if it is changed in Launch Darkly.
 * The scope should usually be provided so that when the directive being A/B
 * tested is destroyed, the feature flag property bus(es) that it was utilizing
 * is/are marked for garbage collection.
 * The method is curried so you can provide scope just once and use the method
 * returned to request as many feature flags as you want and the all will be
 * be marked for gc when the initial scope is destroyed.
 *
 * @param {Scope} $scope
 * @param {String} featureFlag
 * @returns {utils/kefir.PropertyBus}
 */
export const get = curry(_get);

function _get ($scope, featureFlag) {
  // TODO: track calls to get variations/feature flags here
  const initVal = client.variation(featureFlag, DEFAULT_VAL);
  // each invocation of get($s, varName) receives its own
  // property bus so that they can all end independently
  const propBus = createPropertyBus(initVal, $scope);

  client.on(`change:${featureFlag}`, propBus.set);

  // un-memoize propertyBus for feature flag
  propBus.property.onEnd(() => {
    removeFromMap(featureFlag, propBus);
  });

  addToMap(featureFlag, propBus);
  return propBus.property;
}

function removeFromMap (featureFlag, propBusToRemove) {
  remove(featureFlagToPropBusesMap[featureFlag], propBus => propBus === propBusToRemove);

  if (!featureFlagToPropBusesMap[featureFlag].length) {
    delete featureFlagToPropBusesMap[featureFlag];
  }
}

function addToMap (featureFlag, propBus) {
  const propBuses = featureFlagToPropBusesMap[featureFlag];

  if (Array.isArray(propBuses)) {
    featureFlagToPropBusesMap[featureFlag].push(propBus);
  } else {
    featureFlagToPropBusesMap[featureFlag] = [propBus];
  }
}
