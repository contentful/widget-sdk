import $window from '$window';
import _ from 'lodash';
import {settings} from 'environment';
import LazyLoader from 'LazyLoader';
import Schemas from 'analytics/snowplow/Schemas';

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
  _snowplow = _.noop;
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
 * @name analytics/snowplow/Snowplow#trackGenericEvent
 * @param {string} eventName
 * @param {object} [data={}]
 * @description
 * Sends a tracking event to Snowplow if a `generic` schema has been registered for
 * the provided event. Transforms data from our analytics format to snowplow's
 * `generic` schema.
 */
function trackGenericEvent (eventName, data) {
  data = data || {};
  const schema = Schemas.getByEventName(eventName);
  if (schema && schema.name !== 'generic') {
    _snowplow('trackUnstructEvent', {
      'schema': schema.path,
      'data': transformGenericData(eventName, data)
    });
  }
}

/**
 * @ngdoc method
 * @name analytics/snowplow/Snowplow#trackEntityAction
 * @param {string} eventName
 * @param {object} entityData
 * @description
 * Sends an event to Snowplow with the entity as a linked context.
 */
function trackEntityAction (eventName, entityData) {
  const schema = Schemas.getByEventName(eventName);
  if (!schema) { return; }

  const context = getEntityContext(schema, entityData);
  _snowplow('trackUnstructEvent', {
    'schema': schema.path,
    'data': {}
  }, [context]);
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

function transformGenericData (eventName, data) {
  return {
    'scope': extractScope(eventName),
    'action': extractAction(eventName),
    'organization_id': data.organizationId,
    'space_id': data.spaceId,
    'executing_user_id': data.userId,
    'payload': _.transform(
      _.omit(data, ['organizationId', 'spaceId', 'userId', 'currentState']), function (acc, val, key) {
        acc[_.snakeCase(key)] = val;
      }
    )
  };
}

function getEntityContext (schema, data) {
  const entitySchema = schema.context;
  const context = {
    'schema': Schemas.get(entitySchema).path,
    'data': {
      'action': data.actionData.action,
      'executing_user_id': data.userId,
      'organization_id': data.organizationId,
      'space_id': data.spaceId
    }
  };
  context.data[`${entitySchema}_id`] = _.get(data, 'response.data.sys.id');

  return context;
}

function extractScope (eventName) {
  return _.first(eventName.split(':'));
}

function extractAction (eventName) {
  return _.last(eventName.split(':'));
}

const Snowplow = {
  enable: _.once(enable),
  disable: disable,
  identify: identify,
  trackGenericEvent: trackGenericEvent,
  trackEntityAction: trackEntityAction
};

export default Snowplow;
