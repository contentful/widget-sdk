import {get as getAtPath, snakeCase, partial} from 'lodash';
import {getTransformer as fetchTransformer} from 'analytics/snowplow/Transformers';
import {getSchema as fetchSchema} from 'analytics/snowplow/Schemas';

/**
 * @ngdoc service
 * @name analytics/snowplow/Events
 * @description
 * Registers each analytics event which should be sent to Snowplow with a
 * corresponding schema and transformer name. Returns transformers and schemas
 * associated with specific analytics events.
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
 * @returns {object} transformer
 * @description
 * Returns object with transform method. Transform method has `eventName`
 * partially applied and just needs to be called with the `data`.
 *
 * @usage[js]
 * const rawData = {foo: '!!!!'}
 * const transformer = Events.getTransformer('content_type:create');
 * const dataForSnowplow = transformer.transform(rawData);
 */
export function getTransformer (eventName) {
  const name = getAtPath(_events, [eventName, 'transformer']);
  return {
    transform: partial(fetchTransformer(name), eventName)
  };
}

/**
 * @ngdoc method
 * @name analytics/snowplow/Events#getTransformer
 * @param {string} eventName
 * @returns {object} schema
 * @description
 * Returns schema for provided event
 */
export function getSchema (eventName) {
  const name = getAtPath(_events, [eventName, 'schema']);
  return fetchSchema(name);
}
