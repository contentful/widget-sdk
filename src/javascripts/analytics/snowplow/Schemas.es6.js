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
  version: '1-0-1'
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

registerSchema({
  name: 'boilerplate',
  version: '1-0-0'
});

registerSchema({
  name: 'experiment',
  version: '1-0-2'
});

registerSchema({
  name: 'experiment_start',
  version: '1-0-0'
});

registerSchema({
  name: 'experiment_interaction',
  version: '1-0-0'
});

registerSchema({
  name: 'app',
  version: '1-0-0'
});

registerSchema({
  name: 'app_open',
  version: '1-0-0'
});

registerSchema({
  name: 'page_view',
  version: '1-0-0'
});

registerSchema({
  name: 'feature_bulk_editor',
  version: '1-0-0'
});

registerSchema({
  name: 'feature_snapshot',
  version: '1-0-0'
});

registerSchema({
  name: 'personal_access_token',
  version: '1-0-0'
});

registerSchema({
  name: 'search_perform',
  version: '1-0-0'
});

registerSchema({
  name: 'view_create',
  version: '1-0-0'
});

registerSchema({
  name: 'view_edit',
  version: '1-0-0'
});

registerSchema({
  name: 'view_delete',
  version: '1-0-0'
});

registerSchema({
  name: 'view_load',
  version: '1-0-0'
});

registerSchema({
  name: 'element_click',
  version: '2-0-0'
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
