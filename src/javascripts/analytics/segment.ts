/* eslint-disable @typescript-eslint/ban-ts-comment */

import _ from 'lodash';
import * as CallBuffer from 'utils/CallBuffer';
import * as LazyLoader from 'utils/LazyLoader';
import { captureError } from 'core/monitoring';
import * as Config from 'Config';
import * as Intercom from 'services/intercom';
import { window } from 'core/services/window';
import { getSegmentSchemaForEvent, getSegmentExperimentSchemaForEvent } from './transform';
import { TransformedEventData } from './types';
import { Schema } from './SchemasSegment';
import * as plan from './events';
import { Options, Callback } from './generated/segment';

/**
 * All calls (`track`, `page`, `identify`)
 * are buffered and executed after `enable`
 * call. Once disabled, this service cannot
 * be enabled again.
 */

/**
 * Our intercom setup doesn't care about
 * `track()` events sent from UI and it has
 * a limit of 120 unique event names.
 *
 * We forcefully disable this integration
 * here so we won't get exceptions in the
 * dev tools.
 */
const TRACK_INTEGRATIONS = {
  Intercom: false,
};

const buffer = CallBuffer.create();
const bufferedTrack = bufferedCall('track');
let isEnabled = false;

/**
 * Loads lazily the script and starts
 * sending analytical events.
 */
function enable(loadOptions = {}) {
  if (!isEnabled) {
    isEnabled = true;

    install(loadOptions).then(buffer.resolve);
  }
}

function bufferedCall(fnName, fn?) {
  return function (...args) {
    buffer.call((analytics) => {
      try {
        (fn ? fn : analytics[fnName])(...args);
      } catch (err) {
        captureError(err, {
          extra: {
            analyticsFn: fnName,
            analyticsFnArgs: args,
          },
        });
      }
    });
  };
}

// Adapted from the docs ("step 1" section):
// https://segment.com/docs/sources/website/analytics.js/quickstart/
function install(loadOptions) {
  const analytics = (window.analytics = window.analytics || []);

  // @ts-expect-error
  if (analytics.initialize || analytics.invoked) {
    return Promise.reject();
  } else {
    // @ts-expect-error
    analytics.invoked = true;
  }

  // @ts-expect-error
  analytics.methods = [
    'trackSubmit',
    'trackClick',
    'trackLink',
    'trackForm',
    'pageview',
    'identify',
    'reset',
    'group',
    'track',
    'ready',
    'alias',
    'debug',
    'page',
    'once',
    'off',
    'on',
  ];

  // @ts-expect-error
  analytics.factory = (method) =>
    function (...args) {
      args.unshift(method);
      // @ts-expect-error
      analytics.push(args);
      return analytics;
    };

  // @ts-expect-error
  analytics.methods.forEach((key) => {
    // @ts-expect-error
    analytics[key] = analytics.factory(key);
  });

  analytics.load = _.noop;
  // @ts-expect-error analyticsJS to work as the legacy
  analytics._loadOptions = loadOptions;
  analytics.ready(() => {
    // Only enable Intercom if the user actually enabled it
    //
    // Note: Intercom is capitalized on purpose here
    if (loadOptions?.integrations?.Intercom) {
      Intercom.enable();
    }
  });

  return LazyLoader.get('segment');
}

async function getIntegrations() {
  const integrationsUrl = `https://cdn.segment.com/v1/projects/${Config.services.segment_io}/integrations`;

  let resp;

  try {
    resp = await (await window.fetch(integrationsUrl)).json();
  } catch (error) {
    return [];
  }

  return resp.map((item) => item.creationName);
}

type PropsOnlyPlanTrackingFn<Fn> = Fn extends (
  props: infer P,
  options?: Options,
  callback?: Callback
) => void
  ? (props: P) => void
  : never;
export type Plan = { [P in keyof typeof plan]: PropsOnlyPlanTrackingFn<typeof plan[P]> };

const wrappedPlan: Plan = _.mapValues(plan, (planFn) => (props) => {
  // Calls are buffered by the fact that these functions internally are calling window.analytics.track()
  // which is set up above with buffered calls until the real `window.analytics` is lazy loaded.
  planFn(props, { integrations: TRACK_INTEGRATIONS });
});

export default {
  /**
   * Exposes Segment typewriter tracking functions for all known Segment events.
   */
  plan: wrappedPlan,
  enable: _.once(enable),
  /**
   * Sends a single event with data to
   * the selected integrations.
   */
  track: function track(event: string, data: TransformedEventData): void {
    const schema = getSegmentSchemaForEvent(event) as Schema;
    const eventPayload = buildPayload(schema, data);

    bufferedTrack(schema.name, eventPayload, { integrations: TRACK_INTEGRATIONS });

    experimentalTrack(event, data);
  },
  /**
   * Sets current page.
   */
  page: bufferedCall('page'),
  /**
   * Sets current user traits.
   */
  identify: bufferedCall('identify'),
  getIntegrations,
};

export function buildPayload(schema: Schema, data: TransformedEventData): object {
  return schema.wrapPayloadInData
    ? data // `data` might contain other legacy props `schema` and `contexts` next to `data.data`
    : data.data;
}

/**
 * This is tracking some legacy events a new way to avoid certain issues with the Snowplow -> Segment
 * migration so far.
 * Currently we're only tracking a few events this way (see transform.ts for a list) while also tracking
 * all events the old way until we're certain we don't wan't to iterate further on this approach and
 * switch to it for all events.
 * In the long term, all events should be migrated to Typewriter (Analytics.tracking. functions).
 */
function experimentalTrack(event: string, data: TransformedEventData) {
  const schema = getSegmentExperimentSchemaForEvent(event) as Schema;
  if (schema) {
    const eventPayload = buildExperimentPayload(data);
    bufferedTrack(schema.name, eventPayload, {
      integrations: { All: false }, // Do not track to any integrations for this experiment.
    });
  }
}

export function buildExperimentPayload(data: TransformedEventData): object {
  const payload = {
    // There might be some events with transformers not sticking to returning a `TransformedEventData` object.
    // E.g. `space_purchase:...` events. For these, also include all unexpected props into the event payload.
    ..._.omit(data, ['contexts', 'data', 'schema']),
    // Do NOT wrap as { data }. This would result in `data_` prefixes for all fields, which was a bug/behavior previously:
    // https://contentful.atlassian.net/wiki/spaces/ENG/pages/3037626506/2021-04-30+Web+app+Segment+migration+issues#1.-data_-prefixes-on-migrated-schema-fields
    ...data.data,
  } as any;
  delete payload.executing_user_id; // We have Segment's `user_id` which is added for us.

  if (data.contexts && !payload.contexts) {
    // "contexts" is a Snowplow concept, we store them as JSON blob. They were only used in a meaningful way for the
    // `entry_editor:view`, `element:click`, `entry:publish` and `space:create` events.
    // It is also used in a trivial way for `global:app_loaded` and `entry:create` where the
    // "contexts" data should probably just be added to the main event.
    payload.contexts = JSON.stringify(data.contexts, null, 0);
  }
  // TODO: There's a HUGE opportunity to improve "generic" events in Segment. Roughly like this:
  // if (schema.isGenericEvent) { // A.isGenericEvent could be easily added in `transform.ts`'s `registerSnowplowEvent()`.
  //   // Context: In Snowplow, the "payload" was a JSON blob for arbitrary schemaless tracking data as a means for
  //   //  product teams to quickly add new events without the overhead of defining a schema first.
  //   delete payload.payload;
  //   Object.assign(payload, data.data.payload);
  // }

  // TODO: Enrich all events with `environment_key` if possible.

  const RENAME_PROPS = {
    space_id: 'space_key',
    environment_id: 'environment_key',
    organization_id: 'organization_key',
  };
  _.forEach(RENAME_PROPS, (renamed, original) => {
    if (payload[original]) {
      payload[renamed] = payload[original];
      delete payload[original];
    }
  });
  return payload;
}
