/* eslint-disable @typescript-eslint/ban-ts-comment */

import _ from 'lodash';
import * as CallBuffer from 'utils/CallBuffer';
import * as LazyLoader from 'utils/LazyLoader';
import { captureError } from 'core/monitoring';
import * as Config from 'Config';
import * as Intercom from 'services/intercom';
import { window } from 'core/services/window';
import { getSegmentSchemaForEvent } from './transform';
import {
  TransformedEventData,
  TransformedSegmentEventData,
  SegmentSchema as Schema,
} from './types';
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
  track: function track(event: string, data: TransformedSegmentEventData): void {
    const schema = getSegmentSchemaForEvent(event) as Schema;

    bufferedTrack(schema.name, data.payload, { integrations: TRACK_INTEGRATIONS });
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

export function transformSnowplowToSegmentData(
  event: string,
  data: TransformedEventData,
  environmentId?: string
): TransformedSegmentEventData {
  const schema = getSegmentSchemaForEvent(event) as Schema;

  // TODO: Apply below optimizations for `generic` events with the following differences to Snowplow:
  //  - There's no single `generic` schema. Instead, use the snake cased web app event ID as schema name.
  //    E.g. `global_space_changed` instead of `generic` for `global:space_changed`.
  //  - merge all generic event `payload` field props into `data` and delete `data.payload` and `data.scope`.
  //  - Apply all changes as for non-generic events below.
  if (schema.isLegacySnowplowGeneric) {
    // For now we keep tracking Snowplow `generic` schema events the old way and even wrap { data } so that
    // event fields consistently keep the `data_` prefix.
    return { payload: { ...data } };
  }
  const objPayload = {
    // There might be some events with transformers not sticking to returning a `TransformedEventData` object.
    // E.g. `space_purchase:...` events. For these, also include all unexpected props into the event payload.
    ..._.omit(data, ['contexts', 'data', 'schema']),
    // Do NOT wrap as { data }. This would result in `data_` prefixes for all fields, which was a bug/behavior previously:
    // https://contentful.atlassian.net/wiki/spaces/ENG/pages/3037626506/2021-04-30+Web+app+Segment+migration+issues#1.-data_-prefixes-on-migrated-schema-fields
    ...data.data,
  } as any;
  // Segment takes properties that are objects and turns them into separate columsn. E.g. { foo: { bar: 'baz' } }
  // would result in a `foo_bar` field instead of a `foo` field with stringified JSON as in Snowplow. This is relevant
  // for e.g. the entity_editor_edit_conflict's `precomputed` or feature_text_editor's `additional_data`.
  // For arrays, Segment seems to stringify by itself, so no action required.
  const payload = _.mapValues(objPayload, (value) =>
    _.isPlainObject(value) ? JSON.stringify(value) : value
  );
  delete payload.executing_user_id; // We have Segment's `user_id` which is added for us.

  if (data.contexts && !payload.contexts) {
    // "contexts" is a Snowplow concept, we store them as JSON blob. They were only used in a meaningful way for the
    // `entry_editor:view`, `element:click`, `entry:publish` and `space:create` events.
    // It is also used in a trivial way for `global:app_loaded` and `entry:create` where the
    // "contexts" data should probably just be added to the main event.
    payload.contexts = JSON.stringify(data.contexts, null, 0);
  }

  const RENAME_PROPS = {
    space_id: 'space_key',
    environment_id: 'environment_key',
    organization_id: 'organization_key',
  };
  _.forEach(RENAME_PROPS, (renamed, original) => {
    if (original in payload) {
      payload[renamed] = payload[original];
      delete payload[original];
    }
  });
  // Add `environment_key` if event has a `space_key`. Events that aren't space scoped won't be env scoped either.
  if (!payload.environment_key && environmentId && payload.space_key) {
    payload.environment_key = environmentId;
  }
  return { payload };
}
