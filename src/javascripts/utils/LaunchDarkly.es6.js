import LD from 'libs/launch-darkly-client';

import {user$} from 'tokenStore';
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

  return !organizationMemberships.reduce((acc, {organization}) => {
    const {subscription: {status: orgStatus}} = organization;
    const isOrgConverted = includes(convertedStatuses, orgStatus);

    return acc || isOrgConverted;
  }, false);
}


/**
 * @ngdoc method
 * @name utils/LaunchDarkly#get
 * @usage[js]
 * const ld = require('utils/LaunchDarkly')
 * const awesomeTest$ = ld.get('my-awesome-test')
 * K.onValueScope($scope, awesomeTest$, callback) // to bind to lifetime of scope
 * // or
 * awesomeTest$.onValue(callback)
 *
 * @description
 * Fetches the value for the requested test.
 * It returns a kefir property that will always give you the
 * value for the test as it is on Launch Darkly servers.
 *
 * @param {String} testName
 * @returns {utils/kefir.Property<boolean>}
 */
export function get (testName) {
  const testVal$ = mergeValues([
    fromEvents(client, 'ready'),
    fromEvents(client, `change:${testName}`)
  ]);

  return sampleBy(testVal$, () => {
    // Launch Darkly has no way of preventing anonymous users from
    // receiving test flags so this makes sure that if the user
    // isn't qualified the test value for any test name is always
    // `null`
    const currentUser = getValue(user$);

    if (currentUser && isQualifiedUser(currentUser)) {
      return client.variation(testName, DEFAULT_VAL);
    } else {
      return DEFAULT_VAL;
    }
  }).skipDuplicates();
}
