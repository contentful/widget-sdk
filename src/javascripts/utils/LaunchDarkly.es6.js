import LD from 'libs/launch-darkly-client';

import {user$, spacesByOrganization$} from 'services/TokenStore';
import {includes, noop} from 'lodash';
import {launchDarkly as config} from 'Config';
import {
  fromEvents,
  getValue,
  merge as mergeValues,
  sampleBy,
  onValueScope
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

  const changeUserContext = (user) => {
    client.identify({
      key: user.sys.id,
      custom: {
        isNonPayingUser: isQualifiedUser(user)
      }
    }, null, noop);
  };

  user$
    .filter(validUser)
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
 *
 * @deprecated Don't use for new A/B tests - instead, use #getFeatureFlag
 * and configure LD to target only users who have the property
 * `isNonPayingUser=true`.
 *
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

/**
 * @ngdoc method
 * @name utils/LaunchDarkly#setOnScope
 * @usage[js]
 * const ld = require('utils/LaunchDarkly')
 * // sets $scope.fooBar for qualufied users only
 * ld.setOnScope($scope, 'foo-bar', 'fooBar', true)
 *
 *
 * @description
 * Convenience method for commonly used scenario - set scope property to a
 * feature flag or A/B test value.
 * It automatically guesses whether it is a feature flag or A/B test based on
 * its name that shoud start with 'feature|test-...'.
 * If name cannot be parsed, an error is thrown.
 *
 * @param {Scope} $scope
 * @param {String} flagName - name of flag in LaunchDarkly
 * @param {String} propertyName - name of property set on scope
 * @param {boolean?} isForQualifiedUsersOnly - whether it should be set for
 * qualified users only (default: false)
 */
export function setOnScope ($scope, flagName, propertyName) {
  const value$ = getFeatureFlag(flagName);

  onValueScope($scope, value$, function (value) {
    $scope[propertyName] = value;
  });
}
