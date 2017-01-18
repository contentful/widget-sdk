import $window from '$window';
import {once, transform, omit, first, last, snakeCase} from 'lodash';
import {settings} from 'environment';
import LazyLoader from 'LazyLoader';
import Schemas from 'analytics/SnowplowSchemas';

/**
 * @ngdoc service
 * @name analytics/Snowplow
 * @description
 * Snowplow service. Enables, disables and sends tracked events to Snowplow.
 * Cannot be re-enabled once the service is disabled.
 */

function _snowplow () {
  (_snowplow.q = _snowplow.q || []).push(arguments);
}
_snowplow.q = [];

let isDisabled = false;

/**
 * @ngdoc method
 * @name analytics/Snowplow#enable
 * @description
 * Initialize tracker and load Snowplow script asynchonously
 */
function enable () {
  initSnowplow();
  LazyLoader.get('snowplow');
}

/**
 * @ngdoc method
 * @name analytics/Snowplow#disable
 * @description
 * Prevent further tracked events from being added to the queue
 */
function disable () {
  isDisabled = true;
}

/**
 * @ngdoc method
 * @name analytics/Snowplow#identify
 * @param {string} userId
 *
 * @description
 * Sets current user in Snowplow
 */
function identify (userId) {
  _snowplow('setUserId', userId);
}

/**
 * @ngdoc method
 * @name analytics/Snowplow#track
 * @param {string} eventName
 * @param {object} [data={}]
 * @description
 * Sends a tracking event to Snowplow if a schema has been registered for the
 * provided event.
 */
function track (eventName, data) {
  data = data || {};
  if (!isDisabled) {
    const schema = Schemas.get(eventName);
    if (schema) {
      // TODO: may want to add some schema validation
      snowplow('trackUnstructEvent', {
        'schema': schema,
        'data': transformData(eventName, data)
      });
    }
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

  // _snowplow('enableActivityTracking', 30, 30); // Ping every 30 seconds after 30 seconds
  // _snowplow('enableLinkClickTracking');
  // _snowplow('trackPageView');
}

function transformData (eventName, data) {
  if (Schemas.isGeneric(eventName)) {
    return transformGenericData(eventName, data);
  } else {
    // TODO: verify that all events sent to Snowplow have this `action` property
    data.action = extractAction(eventName);
    return transform(data, function (acc, val, key) {
      acc[getSnowplowPropertyName(key)] = val;
    });
  }
}

// TODO: consider adding `currentState` to generic schema
function transformGenericData (eventName, data) {
  return {
    'scope': extractScope(eventName),
    'action': extractAction(eventName),
    'organization_id': data.organizationId,
    'space_id': data.spaceId,
    'executing_user_id': data.userId,
    'payload': transform(
      omit(data, ['organizationId', 'spaceId', 'userId']), function (acc, val, key) {
        acc[snakeCase(key)] = val;
      }
    )
  };
}

function extractScope (eventName) {
  return first(eventName.split(':'));
}

function extractAction (eventName) {
  return last(eventName.split(':'));
}

function getSnowplowPropertyName (key) {
  const transformedKey = snakeCase(key);
  const keyMap = {
    'user_id': 'executing_user_id'
  };
  return keyMap[transformedKey] || transformedKey;
}

const Snowplow = {
  enable: once(enable),
  disable: disable,
  identify: identify,
  track: track
};

export default Snowplow;
