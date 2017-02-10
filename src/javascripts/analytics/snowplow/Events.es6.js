import {get as getAtPath, snakeCase} from 'lodash';
import {getSchema as fetchSchema} from 'analytics/snowplow/Schemas';

import EntityAction from 'analytics/snowplow/transformers/SpaceEntityAction';
import Generic from 'analytics/snowplow/transformers/Generic';
import SpaceCreate from 'analytics/snowplow/transformers/SpaceCreate';
import ExperimentTransform from 'analytics/snowplow/transformers/Experiment';
import {
  ClipboardCopyTransform,
  BoilerplateTransform
} from 'analytics/snowplow/transformers/ApiKey';
import AppOpen from 'analytics/snowplow/transformers/AppOpen';

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

registerEvent('experiment:start', 'experiment', ExperimentTransform);

registerEvent('api_key:clipboard_copy', 'api_key', ClipboardCopyTransform);

registerEvent('api_key:boilerplate', 'boilerplate', BoilerplateTransform);

registerEntityActionEvent('content_type:create');
registerEntityActionEvent('entry:create');
registerEntityActionEvent('api_key:create');
registerEntityActionEvent('asset:create');

registerEvent('space:create', 'space_create', SpaceCreate);
registerEvent('global:app_loaded', 'app_open', AppOpen);


function registerGenericEvent (event) {
  registerEvent(event, 'generic', Generic);
}

function registerEntityActionEvent (event) {
  registerEvent(event, snakeCase(event), EntityAction);
}

function registerEvent (event, schema, transformer) {
  _events[event] = {
    'schema': schema,
    'transformer': transformer
  };
}

/**
 * @ngdoc method
 * @name analytics/snowplow/Events#transform
 * @param {string} eventName
 * @param {object} data
 * @returns {object} transformedData
 * @description
 * Returns data transformed for Snowplow
 */
export function transform (event, data) {
  const transformer = getAtPath(_events, [event, 'transformer']);
  return transformer(event, data);
}


/**
 * @ngdoc method
 * @name analytics/snowplow/Events#getSchema
 * @param {string} eventName
 * @returns {object} schema
 * @description
 * Returns schema for provided event
 */
export function getSchema (eventName) {
  const name = getAtPath(_events, [eventName, 'schema']);
  return fetchSchema(name);
}
