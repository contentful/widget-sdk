import LD from 'libs/launch-darkly-client';

import {user$} from 'tokenStore';
import {createPropertyBus} from 'utils/kefir';
import {launchDarkly as config} from 'Config';
import {curry, forEach, includes, remove, noop} from 'lodash';


let client;
const testToBusesMap = {};
const DEFAULT_VAL = null;

/**
 * @ngdoc method
 * @name utils/LaunchDarkly#init
 * @usage[js]
 * require('utils/LaunchDarkly').init(<unique id>)
 *
 * @description
 * Initialize a LaunchDarkly client.
 *
 * @param {string} userId - unique user ID
 */
export function init (userId = 'anonymous-user') {
  // singleton
  if (client) {
    return;
  }

  const defaultAnonUser = {
    key: userId,
    anonymous: true
  };

  client = LD.initialize(config.envId, defaultAnonUser, {
    bootstrap: 'localStorage'
  });

  // since get($scope, testName) always returns immediately, it might
  // return a stale value. This makes sure that all requested
  // variations/test flags get their actual values once
  // LaunchDarkly has completed initialization.
  client.on('ready', () => {
    forEach(testToBusesMap, (propBuses, testName) => {
      forEach(propBuses, propBus => {
        propBus.set(client.variation(testName, DEFAULT_VAL));
      });
    });
  });

  const validUser = user => user && user.email;

  // a qualified user doesn't belong to a paying/converted org
  const isQualifiedUser = ({organizationMemberships}) => {
    const convertedStatuses = ['paid', 'free_paid'];

    return !organizationMemberships.reduce((acc, {organization}) => {
      const {subscription: {status: orgStatus}} = organization;
      const isOrgConverted = includes(convertedStatuses, orgStatus);

      return acc || isOrgConverted;
    }, false);
  };

  const changeUserContext = ({email, firstName, lastName, organizationMemberships}) => {
    // custom properties can only be strings, bools, numbers or lists of those
    const baseLdUser = {
      key: email,
      firstName,
      lastName,
      email,
      custom: {
        organizationNames: [],
        organizationSubscriptions: []
      }
    };

    const ldUser = organizationMemberships.reduce((ldUser, membership) => {
      const {custom: {organizationNames, organizationSubscriptions}} = ldUser;
      const {organization: {name, subscription: {status}}} = membership;

      organizationNames.push(name);
      organizationSubscriptions.push(status);

      return ldUser;
    }, baseLdUser);

    client.identify(ldUser, null, noop);
  };

  user$
    .filter(validUser)
    .filter(isQualifiedUser)
    .onValue(changeUserContext);
}

/**
 * @ngdoc method
 * @name utils/LaunchDarkly#get
 * @usage[js]
 * const ld = require('utils/LaunchDarkly')
 * ld.get($scope, 'my-awesome-test')
 * // or
 * const getFlagVal = ld.get($scope)
 * const awesomeTest$ = getFlagVal('my-awesome-test')
 * awesomeTest$.onValue(console.log.bind(console, 'val for my-awesome-test:'))
 *
 * @description
 * Fetches the value for the requested test. It accepts angular scope
 * object and the name of the test that you want. It returns a kefir
 * property bus. This bus is a kefir property and will give you the latest
 * value for the test if it is changed in Launch Darkly.
 * The scope should usually be provided so that when the directive being A/B
 * tested is destroyed, the test property bus(es) that it was utilizing
 * is/are marked for garbage collection.
 * The method is curried so you can provide scope just once and use the method
 * returned to request as many tests as you want and the all will be
 * be marked for gc when the initial scope is destroyed.
 *
 * @param {Scope} $scope
 * @param {String} featureFlag
 * @returns {utils/kefir.PropertyBus}
 */
export const get = curry(_get);

function _get ($scope, testName) {
  const initVal = client.variation(testName, DEFAULT_VAL);
  // each invocation of get($s, test) receives its own
  // property bus so that they can all end independently
  const testBus = createPropertyBus(initVal, $scope);

  client.on(`change:${testName}`, testBus.set);

  // un-memoize propertyBus for test
  testBus.property.onEnd(() => {
    removeFromMap(testName, testBus);
  });

  addToMap(testName, testBus);
  return testBus.property;
}

function removeFromMap (testName, testBus) {
  remove(testToBusesMap[testName], bus => bus === testBus);

  if (!testToBusesMap[testName].length) {
    delete testToBusesMap[testName];
  }
}

function addToMap (testName, testBus) {
  const testBuses = testToBusesMap[testName];

  if (Array.isArray(testBuses)) {
    testToBusesMap[testName].push(testBus);
  } else {
    testToBusesMap[testName] = [testBus];
  }
}
