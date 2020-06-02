import * as Config from 'Config';
import * as Snowplow from 'analytics/snowplow';
import stringifySafe from 'json-stringify-safe';
import { prepareUserData } from 'analytics/UserData';
import _ from 'lodash';
import segment from 'analytics/segment';
import { eventExists, transformEvent } from 'analytics/transform';
import * as logger from 'services/logger';
import * as analyticsConsole from 'analytics/analyticsConsole';
import * as random from '../utils/Random';
import { clearSequenceContext, initSequenceContext } from './sequenceContext';

function removeCircularRefs(obj) {
  return JSON.parse(stringifySafe(obj));
}

/**
 * @ngdoc service
 * @name analytics
 * @description
 * This service exposes an API for event tracking.
 *
 * Call to `enable` enables tracking and initializes
 * session data with user's details. There are three
 * tracking methods that are also used to collect
 * session data (`trackContextChange`, `trackStateChange`)
 * . Session data can be obtained with `getSessionData`.
 *
 * The rest of tracking is realised with calls to
 * `track` method.
 *
 * Calling `enable` doesn't mean that the events
 * will be sent to Segment and Snowplow automatically. We perform
 * an environment check to determine if we should do
 * networking.
 *
 * Once disabled, this service cannot be enabled
 * again.
 */

const ANALYTICS_ENVS = ['production', 'staging', 'preview'];
const VALUE_UNKNOWN = {};

let env = Config.env;
const session = {};
let isEnabled = false;

// Ugly but it's super tricky to simulate environment.
// Better ideas needed.
export const __testOnlySetEnv = (_env) => {
  env = _env;
};

/**
 * @ngdoc method
 * @name analytics#enable
 * @description
 * Starts event tracking
 */
export const enable = _.once((user, segmentLoadOptions) => {
  if (isEnabled) {
    return;
  }

  isEnabled = true;

  if (ANALYTICS_ENVS.includes(env)) {
    segment.enable(segmentLoadOptions);
    Snowplow.enable();
  }

  identify(prepareUserData(removeCircularRefs(user)));
  track('global:app_loaded');
});

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
export function getSessionData(path, defaultValue) {
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

export function track(event, data) {
  if (!isEnabled) {
    return;
  }

  if (!eventExists(event)) {
    track('tracking:invalid_event', { event });
    return;
  }

  try {
    data = _.isObject(data) ? _.cloneDeep(data) : {};
    data = removeCircularRefs(Object.assign({}, getBasicPayload(), data));

    const transformedData = transformEvent(event, data);

    segment.track(event, transformedData);
    Snowplow.track(event, transformedData);
    analyticsConsole.add(event, transformedData);
    logEventPayloadSize(event, transformedData);
  } catch (error) {
    // ensure no errors caused by analytics will break business logic
    logger.logError('Unexpected error during event tracking', {
      error,
      message: error.message,
      event,
      data,
    });
  }
}

/**
 * This method helps to identify misuse of the analytics module
 * when SDK Value Objects sent in the event payload instead of
 * Data Transfer Objects. That results in the performance degradations
 * of the web app caused by heavy payload serialization in wootric (loaded in segment)
 *
 */
function logEventPayloadSize(event, safePayload) {
  if (typeof window.requestIdleCallback !== 'undefined') {
    window.requestIdleCallback(() => {
      try {
        const size = JSON.stringify(safePayload).length;

        // any of the payload fields has methods on the first level
        const hasMethods = Object.entries(safePayload || {})
          .flatMap(([_, v]) => Object.values(v || {}))
          .some((v) => _.isFunction(v));

        if (size > 5000 || hasMethods) {
          logger.logWarn('Potentially bloated tracking event payload', {
            event,
            size,
            hasMethods,
          });
        }
      } catch (error) {
        // ignore error
      }
    });
  }
}

/**
 * @description This function allows you to extend user's details
 * which will be sent to segment (and automatically to Intercom)
 * @param {object} params - object with new data
 */
export const updateUserInSegment = identify;

/**
 * @ngdoc method
 * @name analytics#identify
 * @param {object} extension
 * @description
 * Sets or extends session user data. Identifying
 * data is also set on Segment's client.
 */
function identify(extension) {
  session.user = session.user || {};
  const rawUserData = _.merge(session.user, extension || {});

  // we set up organization immediately, if it is not set up yet.
  // the reason for it – we might not have a space, but belong to an
  // organization. This happens, for example, after the user signs up
  // and when they have no spaces – so adding it to the session
  // automatically enriches all events with an organizationId.
  if (!session.organization) {
    // we've already removed all circular references
    // we default to the first org the user belongs to as the "current org".
    // this behaviour is the same as what the sidepanel does when it doesn't find a "current org"
    session.organization = _.get(session, 'user.organizationMemberships[0].organization');
  }

  // We need to remove the list of organization memberships as this array gets
  // flattened when it is passed to Intercom and creates a lot of noise
  const user = _.omitBy(rawUserData, (val) => _.isArray(val) || _.isObject(val));

  const userId = getSessionData('user.sys.id');

  if (userId && user) {
    segment.identify(userId, user);
    Snowplow.identify(userId);
  }

  sendSessionDataToConsole();
}

/**
 * @ngdoc method
 * @name analytics#trackContextChange
 * @param {object} space
 * @param {object} organization
 * @description
 * Sets or replaces session space and organization
 * data. Pass `null` when leaving context.
 *
 * `null` must be explicitly passed to unset the current
 * space/org contexts.
 */

export function trackContextChange(space, organization) {
  if (space) {
    session.space = removeCircularRefs(space);
  } else if (space === null) {
    session.space = null;
  }

  if (organization) {
    session.organization = removeCircularRefs(organization);
  } else if (organization === null) {
    session.organization = null;
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
export function trackStateChange(state, params, from, fromParams) {
  if (!isEnabled) {
    return;
  }

  const data = (session.navigation = removeCircularRefs({
    state: state.name,
    params,
    fromState: from ? from.name : null,
    fromStateParams: fromParams || null,
  }));

  sendSessionDataToConsole();

  if (state.name === 'spaces.detail.entries.list') {
    initSequenceContext({ sequence_key: random.id() });
  } else {
    clearSequenceContext();
  }

  track('global:state_changed', data);
  segment.page(state.name, params);
}

function getBasicPayload() {
  // IMPORTANT: Do not add anything here without ensuring that it won't end up in any Snowplow
  //  events which might be considered invalid with additional properties unknown to their schema!
  return _.pickBy(
    {
      userId: getSessionData('user.sys.id', VALUE_UNKNOWN),
      spaceId: getSessionData('space.sys.id', VALUE_UNKNOWN),
      organizationId: getSessionData('organization.sys.id', VALUE_UNKNOWN),
      currentState: getSessionData('navigation.state', VALUE_UNKNOWN),
    },
    (val) => val !== VALUE_UNKNOWN
  );
}

function sendSessionDataToConsole() {
  analyticsConsole.setSessionData(session);
}
