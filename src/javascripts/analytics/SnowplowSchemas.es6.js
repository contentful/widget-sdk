import {pick, get as getAtPath} from 'lodash';

/**
 * @ngdoc service
 * @name analytics/SnowplowSchemas
 * @description
 * Maps analytics event names to Snowplow schema paths
 */

const _schemas = {};

registerSchema({
  eventName: 'bulk_editor:open',
  schemaName: 'feature_bulk_editor',
  version: '1-0-0'
});

registerGenericSchema('learn:language_selected');
registerGenericSchema('learn:resource_selected');
registerGenericSchema('learn:step_clicked');

function registerSchema (schema) {
  _schemas[schema.eventName] = pick(schema, ['schemaName', 'version']);
}

function registerGenericSchema (eventName) {
  const schema = {
    schemaName: 'generic',
    version: '1-0-0',
    generic: true
  };
  _schemas[eventName] = schema;
}

function buildSchema (schema) {
  return `iglu:com.contentful/${schema.schemaName}/jsonschema/${schema.version}`;
}

/**
 * @ngdoc method
 * @name analytics/SnowplowSchemas#get
 * @param {string} eventName
 * @description
 * Returns schema path if available for the provided event name
 */
function get (eventName) {
  if (_schemas[eventName]) {
    return buildSchema(_schemas[eventName]);
  }
}

/**
 * @ngdoc method
 * @name analytics/SnowplowSchemas#isGeneric
 * @param {string} eventName
 * @description
 * Returns true if event name maps to a generic schema, otherwise false
 */
function isGeneric (eventName) {
  return !!(getAtPath(_schemas[eventName], 'generic'));
}

const Schemas = {
  get: get,
  isGeneric: isGeneric
};

export default Schemas;
