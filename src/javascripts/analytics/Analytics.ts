import * as Config from 'Config';
import segment, { Plan, transformSnowplowToSegmentData } from 'analytics/segment';
import * as snowplow from 'analytics/snowplow';
import stringifySafe from 'json-stringify-safe';
import { prepareUserData } from 'analytics/UserData';
import _ from 'lodash';
import {
  eventExists,
  getSnowplowSchemaForEvent,
  transformEventForSnowplow,
} from 'analytics/transform';
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
 * @deprecated Use `Analytics.tracking.…` methods instead which takes the final event data without
 *  sending it through the deprecated event transformers.
 *
 * Sends tracking event with provided data to Segment and Snowplow if registered properly for the event.
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

    const transformedSnowplowData = transformEventForSnowplow(event, data);
    const transformedSegmentData = transformSnowplowToSegmentData(
      event,
      transformedSnowplowData,
      getEnvironmentId()
    );

    segment.track(event, transformedSegmentData);
    snowplow.track(event, transformedSnowplowData);

    analyticsConsole.add(event, { rawData: data, transformedSegmentData, transformedSnowplowData });

    logEventPayloadSize(event, transformedSnowplowData);
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
 * Exposes all Segment typewriter tracking functions for each Segment plan (schema).
 * E.g. `Analytics.tracking.editorLoaded(props);`
 *
 * Use this instead of `Analytics.track()`. Update event registration and remove
 * transformation from transform.ts when migrating an event from `Analytics.track() and
 * use `migratedLegacyEvent()` if the event should still be tracked to Snowplow too.
 *
 * TODO: Can we enrich `props` with default props `organization_key`, `space_key` and `environment_key`?
 *  Obstacles to this approach:
 *  1. Some events that are org rather than space scoped might only have a `organization_key`
 *  2. Legacy events from Snowplow -> Segment migration have other default properties,
 *    `executing_user_id`, `space_id` and `organization_id`
 *  3. Consider all props being wrapped in `props.data` on at least most legacy events, so default props
 *     had to be attached to either `props.data` if it exists or `props` otherwise.
 *  4. Legacy Snowplow migration events use camelCaseKeys like `executingUserId` in their Segment schema
 *     This should be cleaned up soon as convention for all Segment schemas is also snake_case.
 */
export const tracking: Plan = _.mapValues(segment.plan, (planFn, planKey) => (props) => {
  try {
    // Track to Segment by using original plan function:
    planFn(props);

    // Depending on the `data` format we get and the event we're dealing with, we've got to ensure it's
    // in the right format for Snowplow where we never wrapped { data } while this is done in most
    // migrated events' Snowplow schemas due to an old tracking bug where data was accidentally wrapped.
    const likeTransformedData: TransformedEventData = _.isObject(props.data)
      ? props
      : { data: props };
    const snowplowSchema = getSnowplowSchemaForEvent(planKey);

    if (snowplowSchema) {
      snowplow.track(planKey, likeTransformedData);
    }

    // TODO: Catch errors via `onViolation` Segment TypeWriter option and display in analytics console.
    analyticsConsole.add(planKey, { rawData: props, transformedSnowplowData: likeTransformedData });
  } catch (error) {
    // ensure no errors caused by analytics will break business logic
    captureError(error, {
      extra: {
        planKey,
        data: props,
      },
    });
  }
});

/**
 * Returns props that should be used by all new Segment events tracked via typewriter.
 *
 * TODO: Add these automatically inside `Analytics.typewriter.` functions so that tracking
 *  calls don't have to call this function.
 */
export function defaultEventProps() {
  return _.pickBy(
    {
      space_key: getSessionData('space.sys.id', VALUE_UNKNOWN),
      organization_key: getSessionData('organization.sys.id', VALUE_UNKNOWN),
      environment_key: getSessionData('environment.sys.id', VALUE_UNKNOWN),
    },
    (val) => val !== VALUE_UNKNOWN
  );
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
        Intercom: { user_hash: userSignature }, // for identity verification purpose
      },
    });
    snowplow.identify(userId);
  }

  sendSessionDataToConsole();
}

// TODO: Get rid of `session` data usage and narrow down bare minimum types, ideally pass only IDs.
interface MaybeSys extends Record<string, any> {
  id: string;
}
interface MaybeEntity extends Record<string, any> {
  sys: MaybeSys;
}
type TrackingContext = Partial<
  Record<'organization' | 'space' | 'environment', MaybeEntity | null>
>;

/**
 * Sets or replaces session space and organization data. Pass `null` when leaving context.
 * `null` must be explicitly passed to unset the current space/organization/environment contexts.
 */
export function trackContextChange({ organization, space, environment }: TrackingContext): void {
  if (environment) {
    session.environment = removeCircularRefs(environment);
  } else if (environment === null) {
    session.environment = null;
  }

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
  // TODO: This might cause unnecessary events if space didn't really change!
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

  // TODO: Get rid of this logic and generate a `sequence_key` close to the views where we do the tracking.
  if (['spaces.detail.entries.list', 'spaces.environment.entries.list'].includes(state.name)) {
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

function getEnvironmentId() {
  return getSessionData('environment.sys.id', undefined) as string | undefined;
}

function sendSessionDataToConsole() {
  analyticsConsole.setSessionData(session);
}
