import {get, snakeCase} from 'lodash';

/**
 * @ngdoc service
 * @name analytics/snowplow/Events
 * @description
 * Registers each analytics event which should be sent to Snowplow with a
 * corresponding schema and transformer name.
 */

const _events = {};

registerGenericEvent('learn:language_selected');
registerGenericEvent('learn:resource_selected');
registerGenericEvent('learn:step_clicked');

registerEntityActionEvent('content_type:create');
registerEntityActionEvent('entry:create');
registerEntityActionEvent('api_key:create');
registerEntityActionEvent('asset:create');

function registerGenericEvent (event) {
  registerEvent(event, 'generic', 'generic');
}

function registerEntityActionEvent (event) {
  registerEvent(event, snakeCase(event), 'entityAction');
}

function registerEvent (event, schema, transformer) {
  _events[event] = {
    'schema': schema,
    'transformer': transformer
  };
}

/**
 * @ngdoc method
 * @name analytics/snowplow/Events#getTransformer
 * @param {string} eventName
 * @returns {string}
 * @description
 * Returns transformer name for provided event
 */
export function getTransformer (eventName) {
  return get(_events, [eventName, 'transformer']);
}

/**
 * @ngdoc method
 * @name analytics/snowplow/Events#getTransformer
 * @param {string} eventName
 * @returns {string}
 * @description
 * Returns schema name for provided event
 */
export function getSchema (eventName) {
  return get(_events, [eventName, 'schema']);
}
