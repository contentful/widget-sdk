import LD from 'libs/launch-darkly-client';

import {user$} from 'services/TokenStore';
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
 * require('utils/LaunchDarkly').init(<unique id>)
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
  return getFeatureFlag(testName, (currentUser) => {
    return currentUser && isQualifiedUser(currentUser) && customQualificationFn(currentUser);
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
    fromEvents(client, `change:${featureFlagName}`)
  ]);

  return sampleBy(testVal$, () => {
    const currentUser = getValue(user$);

    return customQualificationFn(currentUser) ? client.variation(featureFlagName, DEFAULT_VAL) : DEFAULT_VAL;
  }).skipDuplicates();
}

/**
 * @ngdoc method
 * @name utils/LaunchDarkly#setOnScope
 * @usage[js]
 * const ld = require('utils/LaunchDarkly')
 * // sets $scope.fooBar
 * ld.setOnScope($scope, 'test-01-01-foo-bar')
 *
 *
 * @description
 * Convenience method for commonly used scenario - set scope property to a
 * feature flag or A/B test value.
 * It parses the name in format 'feature|test-xx-00-00-kebab-case-property-name'
 * and automatically guesses the name of the property, and whether it is a feature
 * flag or A/B test.
 * If name cannot be parsed, an error is thrown.
 *
 * @param {Scope} $scope
 * @param {String} flagName - name of flag in LaunchDarkly
 * @param {String?} propertyName - name of property set on scope (default is parsed from flag name)
 * @returns {type {String}, title {String}} - type of flag ('test' or 'feature')
 * and title of created scope property
 */
export function setOnScope ($scope, flagName, propertyName) {
  const parsed = parseLDName(flagName);
  if (!parsed) {
    throw new Error(`Invalid LD flag name: ${flagName}`);
  }

  const value$ = parsed.type === 'test'
      ? getTest(flagName) : getFeatureFlag(flagName);

  onValueScope($scope, value$, function (value) {
    $scope[propertyName || parsed.title] = value;
  });
}

function parseLDName (name) {
  const matches = /^(feature|test)-\w+-\d+-\d+-(.+)$/.exec(name);
  if (!matches || !matches[1] || !matches[2]) {
    return null;
  }
  const type = matches[1];
  const title = kebabToCamelCase(matches[2]);

  return { type, title };
}

function kebabToCamelCase (str) {
  return str.replace(/-\w/g, (capture) => capture[1].toUpperCase());
}
