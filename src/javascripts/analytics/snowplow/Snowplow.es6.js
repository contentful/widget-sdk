import $window from '$window';
import { once } from 'lodash';
import { snowplow as snowplowConfig, domain } from 'Config';
import LazyLoader from 'LazyLoader';
import { getSchema as getSchemaForEvent, transform } from 'analytics/snowplow/Events';

/**
 * @ngdoc service
 * @name analytics/snowplow/Snowplow
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
  $window.GlobalSnowplowNamespace = [namespace];
  $window[namespace] = snowplow;
  LazyLoader.get('snowplow');

  snowplowSend('newTracker', 'co', snowplowConfig.collector_endpoint, {
    appId: snowplowConfig.app_id,
    platform: 'web',
    bufferSize: snowplowConfig.buffer_size,
    cookieDomain: domain,
    contexts: {
      gaCookies: true
    }
  });

  // Ping every 30 seconds
  snowplowSend('enableActivityTracking', 30, 30);
}

/**
 * @ngdoc method
 * @name analytics/snowplow/Snowplow#enable
 * @description
 * Initialize tracker and load Snowplow script asynchonously
 */
export const enable = once(initSnowplow);

/**
 * @ngdoc method
 * @name analytics/snowplow/Snowplow#disable
 * @description
 * Prevent further calls to `track` from being added to the queue
 */
export function disable() {
  isDisabled = true;
}

/**
 * @ngdoc method
 * @name analytics/snowplow/Snowplow#identify
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
 * @name analytics/snowplow/Snowplow#track
 * @param {string} eventName
 * @param {object} data
 *
 * @description
 * Tracks an event in Snowplow if it is registered in the snowplow events service
 */
export function track(eventName, data) {
  const eventData = buildUnstructEventData(eventName, data);

  if (eventData) {
    snowplowSend(...eventData);
  }
}

/**
 * @ngdoc method
 * @name analytics/snowplow/Snowplow#buildUnstructEventData
 * @param {string} eventName
 * @param {object} data
 * @returns {object[]|undefined}
 *
 * @description
 * Builds an unstructured event for Snowplow. All our current events that reach
 * Snowplow are unstructured in Snowplow parlance.
 */

export function buildUnstructEventData(eventName, data) {
  const schema = getSchemaForEvent(eventName);

  if (schema) {
    const transformedData = transform(eventName, data);

    return [
      'trackUnstructEvent',
      {
        schema: schema.path,
        data: transformedData.data
      },
      transformedData.contexts
    ];
  }
}

function snowplowSend(...args) {
  if (!isDisabled) {
    snowplow.q.push(args);
  }
}
