import { once } from 'lodash';
import { snowplow as snowplowConfig, domain } from 'Config';
import { getSnowplowSchemaForEvent } from 'analytics/transform';
import * as LazyLoader from 'utils/LazyLoader';
import { window } from 'core/services/window';

/**
 * @ngdoc service
 * @name analytics/snowplow
 * @description
 * Snowplow service. Enables, disables and sends tracked events to Snowplow.
 * Cannot be re-enabled once the service is disabled.
 */

const snowplow = { q: [] };
const namespace = 'snowplow';

let isDisabled = false;

// We push events to window.snowplow.q before the library loads.
// When snowplow.js loads, it looks up the value in window.GlobalSnowplowNamespace,
// which we've defined as 'snowplow'. It sends events buffered in
// window['snowplow'].q. Finally it replaces window['snowplow'] with an object
// {push: push}, where push is sends events to snowplow.
function initSnowplow() {
  window.GlobalSnowplowNamespace = [namespace];
  window[namespace] = snowplow;
  LazyLoader.get('snowplow');

  snowplowSend('newTracker', 'co', snowplowConfig.collector_endpoint, {
    appId: snowplowConfig.app_id,
    platform: 'web',
    bufferSize: snowplowConfig.buffer_size,
    cookieDomain: domain,
    stateStorageStrategy: 'cookie',
    contexts: {
      gaCookies: true,
    },
  });

  // Ping every 30 seconds
  snowplowSend('enableActivityTracking', 30, 30);
}

/**
 * @ngdoc method
 * @name analytics/snowplow#enable
 * @description
 * Initialize tracker and load Snowplow script asynchonously
 */
export const enable = once(initSnowplow);

/**
 * @ngdoc method
 * @name analytics/snowplow#disable
 * @description
 * Prevent further calls to `track` from being added to the queue
 */
export function disable() {
  isDisabled = true;
}

/**
 * @ngdoc method
 * @name analytics/snowplow#identify
 * @param {string} userId
 *
 * @description
 * Sets current user id in Snowplow
 */
export function identify(userId) {
  snowplowSend('setUserId', userId);
}

/**
 * @ngdoc method
 * @name analytics/snowplow#track
 * @param {string} eventName
 * @param {object} rawData
 *
 * @description
 * Tracks an event in Snowplow if it is registered in the snowplow events service
 */
export function track(eventName, rawData) {
  const eventData = buildUnstructEventData(eventName, rawData);

  if (eventData) {
    snowplowSend(...eventData);
  }
}

/**
 * @ngdoc method
 * @name analytics/snowplow#buildUnstructEventData
 * @param {string} eventName
 * @param {object} data
 * @returns {object[]|undefined}
 *
 * @description
 * Builds an unstructured event for Snowplow. All our current events that reach
 * Snowplow are unstructured in Snowplow parlance.
 */

export function buildUnstructEventData(eventName, data) {
  const schema = getSnowplowSchemaForEvent(eventName);

  if (schema) {
    return [
      'trackUnstructEvent',
      {
        schema: schema.path,
        data: data.data,
      },
      data.contexts,
    ];
  }
}

function snowplowSend(...args) {
  if (!isDisabled) {
    snowplow.q.push(args);
  }
}
