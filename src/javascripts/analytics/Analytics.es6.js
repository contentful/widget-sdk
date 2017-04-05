import {env} from 'Config';
import segment from 'analytics/segment';
import * as Snowplow from 'analytics/snowplow/Snowplow';
import {prepareUserData} from 'analytics/UserData';
import analyticsConsole from 'analytics/console';
import stringifySafe from 'stringifySafe';
import _ from 'lodash';

/**
 * @ngdoc service
 * @name analytics
 * @description
 * This service exposes an API for event tracking.
 *
 * Call to `enable` enables tracking and initializes
 * session data with user's details. There are three
 * tracking methods that are also used to collect
 * session data (`trackSpaceChange`, `trackStateChange`)
 * . Session data can be obtained with `getSessionData`.
 *
 * The rest of tracking is realised with calls to
 * `track` method.
 *
 * Calling `enable` doesn't mean that the events
 * will be sent to Segment and Snowplow automatically. We perform
 * an environment check to determine if we should do
 * networking. Events are always sent to an instance
 * of `analytics/console`.
 *
 * Once disabled, this service cannot be enabled
 * again.
 */


const ANALYTICS_ENVS = ['production', 'staging', 'preview'];
const VALUE_UNKNOWN = {};

const shouldSend = _.includes(ANALYTICS_ENVS, env);
let session = {};
let isDisabled = false;

/**
 * @ngdoc method
 * @name analytics#enable
 * @description
 * Starts event tracking
 */
export const enable = _.once(function (user) {
  if (isDisabled) {
    return;
  }

  if (shouldSend) {
    segment.enable();
    Snowplow.enable();
  }

  identify(prepareUserData(removeCircularRefs(user)));
  track('global:app_loaded');
});

/**
 * @ngdoc method
 * @name analytics#disable
 * @description
 * Stops event tracking, communication, cleans up
 * session data and blocks next `enable` calls.
 */
export function disable () {
  segment.disable();
  Snowplow.disable();
  isDisabled = true;
  session = {};
  sendSessionDataToConsole();
}

/**
 * @ngdoc method
 * @name analytics#getSessionData
 * @param {string|array?} path
 * @param {any?} defaultValue
 * @returns {object}
 * @description
 * Gets session data. If `path` is provided then
 * extract specific nested value.
 */
export function getSessionData (path, defaultValue) {
  return _.get(session, path || [], defaultValue);
}

/**
 * @ngdoc method
 * @name analytics#track
 * @param {string} event
 * @param {object?} data
 * @description
 * Sends tracking event (with optionally provided data) to Segment and Snowplow
 * if it is on the valid events list.
 */
export function track (event, data) {
  data = _.isObject(data) ? _.cloneDeep(data) : {};
  data = removeCircularRefs(_.extend(data, getBasicPayload()));

  segment.track(event, data);
  Snowplow.track(event, data);
  analyticsConsole.add(event, data);
}

/**
 * @ngdoc method
 * @name analytics#identify
 * @param {object} extension
 * @description
 * Sets or extends session user data. Identifying
 * data is also set on Segment's client.
 */
function identify (extension) {
  session.user = session.user || {};
  const rawUserData = _.merge(session.user, extension || {});

  // We need to remove the list of organization memberships as this array gets
  // flattened when it is passed to Intercom and creates a lot of noise
  const user = _.omit(rawUserData, 'organizationMemberships');

  const userId = getSessionData('user.sys.id');

  if (userId && user) {
    segment.identify(userId, user);
    Snowplow.identify(userId);
  }

  sendSessionDataToConsole();
}

/**
 * @ngdoc method
 * @name analytics#trackSpaceChange
 * @param {API.Space} space
 * @description
 * Sets or replaces session space and organization
 * data. Pass `null` when leaving space context.
 */
export function trackSpaceChange (space) {
  if (space) {
    session.space = removeCircularRefs(_.get(space, 'data', {}));
    session.organization = removeCircularRefs(_.get(space, 'data.organization', {}));
  } else {
    session.space = session.organization = null;
  }

  sendSessionDataToConsole();
  track(space ? 'global:space_changed' : 'global:space_left');
}

/**
 * @ngdoc method
 * @name analytics#trackStateChange
 * @param {object} state
 * @param {object} params
 * @param {object} from
 * @param {object} fromParams
 * @description
 * Sets or replaces session navigation data.
 * Accepts arguments of `$stateChangeSuccess`
 * handler. Current state is set as a page on
 * the Segment's client.
 */
export function trackStateChange (state, params, from, fromParams) {
  const data = session.navigation = removeCircularRefs({
    state: state.name,
    params: params,
    fromState: from ? from.name : null,
    fromStateParams: fromParams || null
  });

  sendSessionDataToConsole();
  track('global:state_changed', data);
  segment.page(state.name, params);
}

function getBasicPayload () {
  return _.pickBy({
    userId: getSessionData('user.sys.id', VALUE_UNKNOWN),
    spaceId: getSessionData('space.sys.id', VALUE_UNKNOWN),
    organizationId: getSessionData('organization.sys.id', VALUE_UNKNOWN),
    currentState: getSessionData('navigation.state', VALUE_UNKNOWN)
  }, function (val) {
    return val !== VALUE_UNKNOWN;
  });
}

function sendSessionDataToConsole () {
  analyticsConsole.setSessionData(session);
}

function removeCircularRefs (obj) {
  return JSON.parse(stringifySafe(obj));
}
