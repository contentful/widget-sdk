import {get as getAtPath, snakeCase} from 'lodash';
import {getSchema as fetchSchema} from './Schemas';

import EntityAction from './transformers/SpaceEntityAction';
import Generic from './transformers/Generic';
import SpaceCreate from './transformers/SpaceCreate';
import createExperimentTransformer from './transformers/Experiment';
import PageViewTransform from './transformers/PageView';
import {
  ClipboardCopyTransform,
  BoilerplateTransform
} from './transformers/ApiKey';
import AppOpen from './transformers/AppOpen';
import BulkEditor from './transformers/BulkEditor';
import Snapshot from './transformers/Snapshot';
import InviteUserExperiment from './transformers/InviteUserExperiment';
import SearchAndViews from './transformers/SearchAndViews';
import ElementClickTransform from './transformers/ElementClick';

/**
 * @ngdoc module
 * @name analytics/snowplow/Events
 * @description
 * Registers each analytics event which should be sent to Snowplow with a
 * corresponding schema and transformer name. Exports functions to obtain the
 * schema and transformer for a given event.
 *
 * See the documentation of `registerEvent()` on how to register an event.
 */

const _events = {};

registerEvent('element:click', 'element_click', ElementClickTransform);
registerEvent('global:state_changed', 'page_view', PageViewTransform);

registerGenericEvent('learn:language_selected');
registerGenericEvent('learn:resource_selected');
registerGenericEvent('learn:step_clicked');

registerBulkEditorEvent('bulk_editor:action');
registerBulkEditorEvent('bulk_editor:add');
registerBulkEditorEvent('bulk_editor:close');
registerBulkEditorEvent('bulk_editor:open');
registerBulkEditorEvent('bulk_editor:status');

registerSnapshotEvent('versioning:no_snapshots');
registerSnapshotEvent('versioning:snapshot_opened');
registerSnapshotEvent('versioning:snapshot_closed');
registerSnapshotEvent('versioning:snapshot_restored');
registerSnapshotEvent('versioning:published_restored');

registerEvent('api_key:clipboard_copy', 'api_key', ClipboardCopyTransform);
registerEvent('api_key:boilerplate', 'boilerplate', BoilerplateTransform);

registerActionEvent('experiment:start', createExperimentTransformer('start'));
registerActionEvent('experiment:interaction', createExperimentTransformer('interaction'));

registerActionEvent('content_type:create', EntityAction);
registerActionEvent('entry:create', EntityAction);
registerActionEvent('api_key:create', EntityAction);
registerActionEvent('asset:create', EntityAction);

registerActionEvent('space:create', SpaceCreate);

registerEvent('global:app_loaded', 'app_open', AppOpen);

registerEvent('invite_user:learn', 'generic', InviteUserExperiment);
registerEvent('invite_user:create_space', 'generic', InviteUserExperiment);

registerEvent('personal_access_token:action', 'personal_access_token', (_, data) => {
  return {
    data: {
      personal_access_token_id: data.patId,
      action: data.action,
      executing_user_id: data.userId
    }
  };
});

registerEvent('search:search_performed', 'search_perform', SearchAndViews);
registerEvent('search:view_created', 'view_create', SearchAndViews);
registerEvent('search:view_edited', 'view_edit', SearchAndViews);
registerEvent('search:view_deleted', 'view_delete', SearchAndViews);
registerEvent('search:view_loaded', 'view_load', SearchAndViews);
registerEvent('search:search_terms_migrated', 'ui_config_migrate', SearchAndViews);

/**
 * Registers an event to be tracked by snowplow.
 * @param {string} event
 *   Name passed to `analytics.track()`
 * @param {string} schema
 *   Name of the schema to put the data into. Must be registered in
 *   `analytics/snowplow/Schemas`.
 * @param {function} transformer
 *   A function to transform the parameters passed to `analytics.track()` to the
 *   data send to snowplow.
 *   Accepts two arguments, the event name and the tracking data. The tracking
 *   data is the second argument of `analytics.track()` merged with common
 *   payload defined in `analytics/Analytics`.
 *   Returns an object with a `data` and optional `context` property.
 */
function registerEvent (event, schema, transformer) {
  _events[event] = {
    schema,
    transformer
  };
}

// Common register patterns
function registerGenericEvent (event) {
  registerEvent(event, 'generic', Generic);
}

function registerActionEvent (event, transformer) {
  registerEvent(event, snakeCase(event), transformer);
}

function registerBulkEditorEvent (event) {
  registerEvent(event, 'feature_bulk_editor', BulkEditor);
}

function registerSnapshotEvent (event) {
  registerEvent(event, 'feature_snapshot', Snapshot);
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
