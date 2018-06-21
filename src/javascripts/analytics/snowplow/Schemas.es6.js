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
  version: '2-0-0'
});

registerSchema({
  name: 'entry_publish',
  version: '2-0-0'
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
  name: 'feature_space_wizard',
  version: '1-0-0'
});

registerSchema({
  name: 'personal_access_token',
  version: '1-0-0'
});

registerSchema({
  name: 'search_perform',
  version: '1-0-1'
});

registerSchema({
  name: 'view_create',
  version: '3-0-0'
});

registerSchema({
  name: 'view_edit',
  version: '2-0-0'
});

registerSchema({
  name: 'view_delete',
  version: '2-0-0'
});

registerSchema({
  name: 'view_load',
  version: '3-0-0'
});

registerSchema({
  name: 'ui_config_migrate',
  version: '1-0-1'
});

registerSchema({
  name: 'element_click',
  version: '2-0-0'
});

registerSchema({
  name: 'slide_in_editor',
  version: '1-0-0'
});

// Objects following this schema are meant to be passed as context
// to other events like element:click hence it has no counterpart
// in snowplow/Events.es6.js and no transformer
registerSchema({
  name: 'content_preview',
  version: '1-0-0'
});

// Objects following this schema are meant to be passed as context
// and hence it has no counterpart in snowplow/Events.es6.js and no transformer
registerSchema({
  name: 'entity_automation_scope',
  version: '1-0-0'
});

registerSchema({
  name: 'entry_view',
  version: '1-0-0'
});

registerSchema({
  name: 'feature_references_metadata',
  version: '1-0-0'
});

registerSchema({
  name: 'feature_reference_actions',
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
