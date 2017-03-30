import {get as getAtPath, snakeCase} from 'lodash';
import {getSchema as fetchSchema} from 'analytics/snowplow/Schemas';

import EntityAction from 'analytics/snowplow/transformers/SpaceEntityAction';
import Generic from 'analytics/snowplow/transformers/Generic';
import SpaceCreate from 'analytics/snowplow/transformers/SpaceCreate';
import createExperimentTransformer from 'analytics/snowplow/transformers/Experiment';
import PageViewTransform from 'analytics/snowplow/transformers/PageView';
import {
  ClipboardCopyTransform,
  BoilerplateTransform
} from 'analytics/snowplow/transformers/ApiKey';
import AppOpen from 'analytics/snowplow/transformers/AppOpen';
import BulkEditor from 'analytics/snowplow/transformers/BulkEditor';
import Snapshot from 'analytics/snowplow/transformers/Snapshot';
import InviteUserExperiment from 'analytics/snowplow/transformers/InviteUserExperiment';


/**
 * @ngdoc service
 * @name analytics/snowplow/Events
 * @description
 * Registers each analytics event which should be sent to Snowplow with a
 * corresponding schema and transformer name. Returns transformers and schemas
 * associated with specific analytics events.
 */

const _events = {};

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

function registerEvent (event, schema, transformer) {
  _events[event] = {
    schema,
    transformer
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
