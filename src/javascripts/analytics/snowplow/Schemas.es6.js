import {pick, get as getAtPath} from 'lodash';

/**
 * @ngdoc service
 * @name analytics/snowplow/Schemas
 * @description
 * Maps analytics event names and schema names to Snowplow schema paths
 */

const _schemas = {};

/*
 * Maps analytics events to Snowplow schema names
 */
const EVENTS_TO_SCHEMAS = {
  'content_type:create': 'content_type_create',
  'entry:create': 'entry_create',
  'api_key:create': 'api_key_create',
  'learn:language_selected': 'generic',
  'learn:resource_selected': 'generic',
  'learn:step_clicked': 'generic'
};

registerSchema({
  name: 'generic',
  version: '1-0-0'
});

registerSchema({
  name: 'entry',
  version: '1-0-0'
});

registerSchema({
  name: 'asset',
  version: '1-0-0',
  context: 'asset'
});

registerSchema({
  name: 'content_type',
  version: '1-0-0'
});

registerSchema({
  name: 'api_key',
  version: '1-0-0'
});

registerSchema({
  name: 'entry_create',
  version: '1-0-0',
  context: 'entry'
});

registerSchema({
  name: 'asset_create',
  version: '1-0-0',
  context: 'asset'
});

registerSchema({
  name: 'content_type_create',
  version: '1-0-0',
  context: 'content_type'
});

registerSchema({
  name: 'api_key_create',
  version: '1-0-0',
  context: 'api_key'
});

function registerSchema (schema) {
  _schemas[schema.name] = pick(schema, ['name', 'version', 'context']);
  _schemas[schema.name].path = buildPath(schema);
}

function buildPath (schema) {
  return `iglu:com.contentful/${schema.name}/jsonschema/${schema.version}`;
}

/**
 * @ngdoc method
 * @name analytics/SnowplowSchemas#get
 * @param {string} schemaName
 * @description
 * Returns schema for the provided schema name
 */
function get (schemaName) {
  return getAtPath(_schemas, schemaName);
}

/**
 * @ngdoc method
 * @name analytics/SnowplowSchemas#getByEventName
 * @param {string} eventName
 * @description
 * Returns schema if available for the provided event name
 */
function getByEventName (eventName) {
  return get(getAtPath(EVENTS_TO_SCHEMAS, eventName));
}

const Schemas = {
  get: get,
  getByEventName: getByEventName
};

export default Schemas;
