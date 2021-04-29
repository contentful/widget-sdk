import * as Config from 'Config';
import segment from 'analytics/segment';
import * as snowplow from 'analytics/snowplow';
import stringifySafe from 'json-stringify-safe';
import { prepareUserData } from 'analytics/UserData';
import _ from 'lodash';
import { eventExists, transformEvent } from 'analytics/transform';
import { TransformedEventData, EventData } from './types';
import { captureError, captureWarning } from 'core/monitoring';
import * as analyticsConsole from 'analytics/analyticsConsoleController';
import * as random from '../utils/Random';
import { clearSequenceContext, initSequenceContext } from './sequenceContext';

const requestIdleCallback = (window as any).requestIdleCallback || _.noop;

function removeCircularRefs(obj): Record<string, unknown> {
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
const session: Record<string, unknown> = {};
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
    snowplow.enable();
  }

  identify(prepareUserData(removeCircularRefs(user)));
  track('global:app_loaded');
});

/**
 * Gets specific nested session data at `path`.
 */
export function getSessionData(path: string, defaultValue?: unknown): unknown {
  return _.get(session, path, defaultValue);
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

export function track(event: string, data?: EventData): void {
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
    snowplow.track(event, transformedData);
    analyticsConsole.add(event, transformedData, data);
    logEventPayloadSize(event, transformedData);
  } catch (error) {
    // ensure no errors caused by analytics will break business logic
    captureError(error, {
      extra: {
        event,
        data,
      },
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
function logEventPayloadSize(eventName: string, safePayload: TransformedEventData) {
  requestIdleCallback(() => {
    try {
      const { contexts: contextEvents = [], ...primaryPayload } = safePayload;
      const primaryEventSize = JSON.stringify(primaryPayload).length;
      // Context events are Snowplow specific
      const contextEventsSize = JSON.stringify(contextEvents).length - 2; // -2 to account for `[]`

      // any of the payload fields has methods on the first level
      const hasMethods = Object.entries(safePayload || {})
        .flatMap(([_, v]) => Object.values(v || {}))
        .some((v) => _.isFunction(v));

      if (primaryEventSize > 5000 || contextEventsSize > 15000 || hasMethods) {
        captureWarning(new Error('Potentially bloated tracking event payload'), {
          extra: {
            event: eventName,
            primaryEventSize,
            contextEventsSize,
            contextEventsCount: contextEvents.length,
            hasMethods,
          },
        });
      }
    } catch (error) {
      // ignore error
    }
  });
}

/**
 * This function allows you to extend user's details which will
 * be sent to segment (and automatically to Intercom)
 */
export const updateUserInSegment = identify;

/**
 * Sets or extends session user data. Identifying data is also set on Segment's client.
 */
function identify(extension?: object): void {
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

  const userId = getSessionData('user.sys.id') as string;
  const userSignature = getSessionData('user.intercomUserSignature');

  if (userId && user) {
    segment.identify(userId, user, {
      integrations: {
        // eslint-disable-next-line @typescript-eslint/camelcase
        Intercom: { user_hash: userSignature }, // for identity verification purpose
      },
    });
    snowplow.identify(userId);
  }

  sendSessionDataToConsole();
}

/**
 * Sets or replaces session space and organization
 * data. Pass `null` when leaving context.
 *
 * `null` must be explicitly passed to unset the current
 * space/org contexts.
 */

export function trackContextChange(space: null | object, organization: null | object): void {
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

// TODO: Either combine trackStateChange() state and params or just pass a string for state.name
type NavigationSate = {
  name: string;
};

/**
 * Sets or replaces session navigation data.
 * Accepts arguments of `$stateChangeSuccess`
 * handler. Current state is set as a page on
 * the Segment's client.
 */
export function trackStateChange(
  state: NavigationSate,
  params: object,
  from: NavigationSate,
  fromParams: object
): void {
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
    // eslint-disable-next-line @typescript-eslint/camelcase
    initSequenceContext({ sequence_key: random.id() });
  } else {
    clearSequenceContext();
  }

  track('global:state_changed', data);
  segment.page(state.name, params);
}

type BasicEventData = {
  userId?: string;
  spaceId?: string;
  organizationId?: string;
  currentState?: string;
};

function getBasicPayload(): BasicEventData {
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
