import {get as getAtPath} from 'lodash';

/**
 * @ngdoc service
 * @name analytics/snowplow/Schemas
 * @description
 * Maps analytics event names and schema names to Snowplow schema paths
 */

const _schemas = {};

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
  version: '1-0-0'
});

registerSchema({
  name: 'content_type',
  version: '1-0-0'
});

registerSchema({
  name: 'api_key',
  version: '2-0-0'
});

registerSchema({
  name: 'entry_create',
  version: '1-0-0'
});

registerSchema({
  name: 'asset_create',
  version: '1-0-0'
});

registerSchema({
  name: 'content_type_create',
  version: '1-0-0'
});

registerSchema({
  name: 'api_key_create',
  version: '1-0-0'
});

registerSchema({
  name: 'space_create',
  version: '1-0-0'
});

registerSchema({
  name: 'space',
  version: '1-0-0'
});

registerSchema({
  name: 'space_template',
  version: '1-0-0'
});

function registerSchema (schema) {
  _schemas[schema.name] = schema;
  _schemas[schema.name].path = buildPath(schema);
}

function buildPath (schema) {
  return `iglu:com.contentful/${schema.name}/jsonschema/${schema.version}`;
}

/**
 * @ngdoc method
 * @name analytics/snowplow/Schemas#getSchema
 * @param {string} schemaName
 * @returns {object} schema
 * @description
 * Returns schema for the provided schema name
 */
export function getSchema (schemaName) {
  return getAtPath(_schemas, schemaName);
}
