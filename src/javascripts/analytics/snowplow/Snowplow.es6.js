import $window from '$window';
import {once, noop} from 'lodash';
import {snowplow as snowplowConfig, domain} from 'Config';
import LazyLoader from 'LazyLoader';
import {getSchema, transform} from 'analytics/snowplow/Events';

/**
 * @ngdoc service
 * @name analytics/snowplow/Snowplow
 * @description
 * Snowplow service. Enables, disables and sends tracked events to Snowplow.
 * Cannot be re-enabled once the service is disabled.
 */

let _snowplow = function _snowplow () {
  (_snowplow.q = _snowplow.q || []).push(arguments);
};
_snowplow.q = [];

/**
 * @ngdoc method
 * @name analytics/snowplow/Snowplow#enable
 * @description
 * Initialize tracker and load Snowplow script asynchonously
 */
export const enable = once(function () {
  initSnowplow();
  LazyLoader.get('snowplow');
});

/**
 * @ngdoc method
 * @name analytics/snowplow/Snowplow#disable
 * @description
 * Prevent further calls to `track` from being added to the queue
 */
export function disable () {
  _snowplow = noop;
}

/**
 * @ngdoc method
 * @name analytics/snowplow/Snowplow#identify
 * @param {string} userId
 *
 * @description
 * Sets current user id in Snowplow
 */
export function identify (userId) {
  _snowplow('setUserId', userId);
}

/**
 * @ngdoc method
 * @name analytics/snowplow/Snowplow#track
 * @param {string} eventName
 *
 * @description
 * Tracks an event in Snowplow if it is registered in the snowplow events service
 */
export function track (eventName, data) {
  const schema = getSchema(eventName);
  if (schema) {
    const transformedData = transform(eventName, data);
    _snowplow('trackUnstructEvent', {
      'schema': schema.path,
      'data': transformedData.data
    }, transformedData.contexts);
  }
}

function initSnowplow () {
  // Required by sp.js
  // Based on https://github.com/snowplow/snowplow/wiki/integrating-javascript-tags-onto-your-website
  $window.GlobalSnowplowNamespace = ['snowplow'];
  $window.snowplow = _snowplow;

  _snowplow('newTracker', 'co', snowplowConfig.collector_endpoint, {
    appId: snowplowConfig.app_id,
    platform: 'web',
    bufferSize: snowplowConfig.buffer_size,
    cookieDomain: domain,
    contexts: {
      gaCookies: true
    }
  });

  // Commented out for now as something here is causing the Snowplow library to send
  // too long URLs
  // _snowplow('enableActivityTracking', 30, 30); // Ping every 30 seconds after 30 seconds
  // _snowplow('enableLinkClickTracking');
  // _snowplow('trackPageView');
}
