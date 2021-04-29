import _ from 'lodash';
import * as CallBuffer from 'utils/CallBuffer';
import * as LazyLoader from 'utils/LazyLoader';
import * as logger from 'services/logger';
import * as Config from 'Config';
import * as Intercom from 'services/intercom';
import { window } from 'core/services/window';
import { getSegmentSchemaForEvent } from './transform';
import { TransformedEventData } from './types';
import { Schema } from './SchemasSegment';

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

function bufferedCall(fnName) {
  return function (...args) {
    buffer.call((analytics) => {
      try {
        analytics[fnName](...args);
      } catch (err) {
        logger.captureError(err, {
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

  if (analytics.initialize || analytics.invoked) {
    return Promise.reject();
  } else {
    analytics.invoked = true;
  }

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

  analytics.factory = (method) =>
    function (...args) {
      args.unshift(method);
      analytics.push(args);
      return analytics;
    };

  analytics.methods.forEach((key) => {
    analytics[key] = analytics.factory(key);
  });

  analytics.load = _.noop;
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

export default {
  enable: _.once(enable),
  /**
   * Sends a single event with data to
   * the selected integrations.
   */
  track: function track(event: string, data: TransformedEventData): void {
    const schema = getSegmentSchemaForEvent(event);
    const eventPayload = buildPayload(schema, data);

    bufferedTrack(schema.name, eventPayload, { integrations: TRACK_INTEGRATIONS });
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
