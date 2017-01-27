import $window from '$window';
import {once, noop} from 'lodash';
import {settings} from 'environment';
import LazyLoader from 'LazyLoader';
import {getSchema, getTransformer} from 'analytics/snowplow/Events';

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
function enable () {
  initSnowplow();
  LazyLoader.get('snowplow');
}

/**
 * @ngdoc method
 * @name analytics/snowplow/Snowplow#disable
 * @description
 * Prevent further calls to `track` from being added to the queue
 */
function disable () {
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
function identify (userId) {
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
function track (eventName, data) {
  const schema = getSchema(eventName);
  if (schema) {
    const transformedData = getTransformer(eventName).transform(data);
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

  _snowplow('newTracker', 'co', settings.snowplow.collector_endpoint, {
    appId: settings.snowplow.app_id,
    platform: 'web',
    bufferSize: settings.snowplow.buffer_size,
    cookieDomain: settings.main_domain,
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

const Snowplow = {
  enable: once(enable),
  disable: disable,
  identify: identify,
  track: track
};

export default Snowplow;
