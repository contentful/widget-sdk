import LD from 'libs/launch-darkly-client';

import {user$, spacesByOrganization$} from 'services/TokenStore';
import {includes, noop} from 'lodash';
import {launchDarkly as config} from 'Config';
import {
  fromEvents,
  getValue,
  merge as mergeValues,
  sampleBy
} from 'utils/kefir';


let client;
const DEFAULT_VAL = null;

/**
 * @ngdoc method
 * @name utils/LaunchDarkly#init
 * @usage[js]
 * require('utils/LaunchDarkly').init()
 *
 * @description
 * Initialize a LaunchDarkly client.
 *
 */
export function init () {
  // singleton
  if (client) {
    return;
  }

  const defaultAnonUser = {
    key: 'anonymous-user',
    anonymous: true
  };

  client = LD.initialize(config.envId, defaultAnonUser, {
    bootstrap: 'localStorage'
  });

  const changeUserContext = ({sys: {id: userId}}) => {
    client.identify({
      key: userId
    }, null, noop);
  };

  user$
    .filter(validUser)
    .filter(isQualifiedUser)
    .onValue(changeUserContext);
}

function validUser (user) {
  return user && user.email;
}

// a qualified user doesn't belong to a paying/converted org
function isQualifiedUser ({organizationMemberships}) {
  const convertedStatuses = ['paid', 'free_paid'];

  // disqualify all users that don't belong to any org
  if (!organizationMemberships) {
    return false;
  }

  return !organizationMemberships.reduce((acc, {organization}) => {
    const {subscription: {status: orgStatus}} = organization;
    const isOrgConverted = includes(convertedStatuses, orgStatus);

    return acc || isOrgConverted;
  }, false);
}

/**
 * @ngdoc method
 * @name utils/LaunchDarkly#getTest
 * @usage[js]
 * const ld = require('utils/LaunchDarkly')
 * const awesomeTest$ = ld.getTest('my-awesome-test')
 * K.onValueScope($scope, awesomeTest$, callback) // to bind to lifetime of scope
 * // or
 * awesomeTest$.onValue(callback)
 *
 * @description
 * Fetches the value for the requested test only for qualified users.
 * It returns a kefir property that will always give you the
 * value for the test as it is on Launch Darkly servers if current user is a
 * qualified one, othervise it will be null.
 *
 * @param {String} testName
 * @param {function} [customQualificationFn = _ => true] - An optional fn that
 * receives the current user and returns a bool. It is applied along with default
 * qualification criteria.
 * @returns {utils/kefir.Property<boolean>}
 */
export function getTest (testName, customQualificationFn = _ => true) {
  // Launch Darkly has no way of preventing anonymous users from
  // receiving test flags so this makes sure that if the user
  // isn't qualified the test value for any test name is always
  // `null`
  return getFeatureFlag(testName, (currentUser, spacesByOrg) => {
    return currentUser && isQualifiedUser(currentUser) && customQualificationFn(currentUser, spacesByOrg);
  });

}

/**
 * @ngdoc method
 * @name utils/LaunchDarkly#getFeatureFlag
 * @usage[js]
 * const ld = require('utils/LaunchDarkly')
 * const awesomeFeatureFlag$ = ld.getFeatureFlag('my-awesome-feature-flag')
 * K.onValueScope($scope, awesomeFeatureFlag$, callback) // to bind to lifetime of scope
 * // or
 * awesomeFeatureFlag$.onValue(callback)
 *
 * @description
 * Fetches the value for the requested feature flag.
 * It returns a kefir property that will always give you the
 * value for the feature flag as it is on Launch Darkly servers.
 *
 * @param {String} featureFlagName
 * @param {function} [customQualificationFn = _ => true] - An optional fn that
 * receives the current user and returns a bool.
 * @returns {utils/kefir.Property<boolean>}
 */
export function getFeatureFlag (featureFlagName, customQualificationFn = _ => true) {
  const testVal$ = mergeValues([
    fromEvents(client, 'ready'),
    fromEvents(client, `change:${featureFlagName}`),
    user$, // if user changes, the feature flag value should be updated as well
    spacesByOrganization$
  ]);


  return sampleBy(testVal$, () => {
    const currentUser = getValue(user$);
    const spacesByOrg = getValue(spacesByOrganization$);

    return customQualificationFn(currentUser, spacesByOrg) ? client.variation(featureFlagName, DEFAULT_VAL) : DEFAULT_VAL;
  }).skipDuplicates();
}
