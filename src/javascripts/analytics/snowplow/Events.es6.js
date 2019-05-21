import { get as getAtPath, snakeCase } from 'lodash';
import { getSchema as fetchSchema } from './Schemas.es6';

import EntityAction from './transformers/EntityAction.es6';
import EntryActionV2 from './transformers/EntryActionV2.es6';
import Generic from './transformers/Generic.es6';
import SpaceCreate from './transformers/SpaceCreate.es6';
import SpaceWizardTransformer from './transformers/SpaceWizard.es6';
import createExperimentTransformer from './transformers/Experiment.es6';
import PageViewTransform from './transformers/PageView.es6';
import { ClipboardCopyTransform, BoilerplateTransform } from './transformers/ApiKey.es6';
import AppOpen from './transformers/AppOpen.es6';
import BulkEditor from './transformers/BulkEditor.es6';
import SlideInEditor from './transformers/SlideInEditor.es6';
import EditorLoad from './transformers/EditorLoad.es6';
import TranslationSidebar from './transformers/TranslationSidebar.es6';
import Snapshot from './transformers/Snapshot.es6';
import InviteUserExperiment from './transformers/InviteUserExperiment.es6';
import SearchAndViews from './transformers/SearchAndViews.es6';
import ElementClickTransform from './transformers/ElementClick.es6';
import EntryViewTransform from './transformers/EntryView.es6';
import ReferenceEditorTransform from './transformers/ReferenceEditor.es6';
import ExtensionSaveTransform from './transformers/ExtensionSave.es6';
import ExtensionInstallTransform from './transformers/ExtensionInstall.es6';
import WebhookEditorTransform from './transformers/WebhookEditor.es6';
import FeatureTextEditorTransform from './transformers/FeatureTextEditor.es6';
import SSOSelfConfigurationTransformer from './transformers/SSOSelfConfiguration.es6';

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

registerEvent('extension:save', 'ui_extension_save', ExtensionSaveTransform);
registerEvent('extension:install', 'ui_extension_install', ExtensionInstallTransform);

registerGenericEvent('learn:language_selected');
registerGenericEvent('learn:resource_selected');
registerGenericEvent('learn:step_clicked');

registerGenericEvent('reference_editor:create_entry');
registerGenericEvent('reference_editor:edit_entry');

registerGenericEvent('markdown_editor:action');

registerGenericEvent('entity_button:click');

registerGenericEvent('incoming_links:dialog_open');
registerGenericEvent('incoming_links:dialog_confirm');
registerGenericEvent('incoming_links:dialog_link_click');
registerGenericEvent('incoming_links:sidebar_link_click');
registerGenericEvent('incoming_links:query');

registerGenericEvent('usage:period_selected');

registerGenericEvent('apps:opted_in');
registerGenericEvent('netlify:connected');
registerGenericEvent('netlify:installed');
registerGenericEvent('netlify:updated');
registerGenericEvent('netlify:uninstalled');
registerGenericEvent('netlify:build_triggered');
registerGenericEvent('netlify:preview_opened');
registerGenericEvent('algolia:installed');
registerGenericEvent('algolia:updated');
registerGenericEvent('algolia:uninstalled');
registerGenericEvent('optimizely:installed');
registerGenericEvent('optimizely:updated');
registerGenericEvent('optimizely:uninstalled');
registerGenericEvent('aiImageManagement:installed');
registerGenericEvent('aiImageManagement:uninstalled');
registerGenericEvent('approval:installed');
registerGenericEvent('approval:uninstalled');

registerGenericEvent('quick_navigation:opened_by_shortcut');

registerBulkEditorEvent('bulk_editor:add');
registerBulkEditorEvent('bulk_editor:unlink');
registerBulkEditorEvent('bulk_editor:navigate');
registerBulkEditorEvent('bulk_editor:collapse');
registerBulkEditorEvent('bulk_editor:expand');
registerBulkEditorEvent('bulk_editor:edit_in_entry_editor');
registerBulkEditorEvent('bulk_editor:open');
registerBulkEditorEvent('bulk_editor:open_slide_in');
registerBulkEditorEvent('bulk_editor:close');
registerBulkEditorEvent('bulk_editor:status');

registerSlideInEditorEvent('slide_in_editor:peek_click');
registerSlideInEditorEvent('slide_in_editor:arrow_back');
registerSlideInEditorEvent('slide_in_editor:bulk_editor_close');
registerSlideInEditorEvent('slide_in_editor:open');
registerSlideInEditorEvent('slide_in_editor:open_create');
registerSlideInEditorEvent('slide_in_editor:delete');

registerTranslationSidebarEvent('translation_sidebar:toggle_widget_mode');
registerTranslationSidebarEvent('translation_sidebar:deselect_active_locale');
registerTranslationSidebarEvent('translation_sidebar:update_active_locales');
registerTranslationSidebarEvent('translation_sidebar:change_focused_locale');

registerEditorLoadEvent('editor_load:init');
registerEditorLoadEvent('editor_load:sharejs_connected');
registerEditorLoadEvent('editor_load:links_rendered');
registerEditorLoadEvent('editor_load:fully_interactive');

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
registerActionEvent('entry:create', EntryActionV2);
registerActionEvent('entry:publish', EntryActionV2);
registerActionEvent('api_key:create', EntityAction);
registerActionEvent('asset:create', EntityAction);

registerActionEvent('space:create', SpaceCreate);

registerSpaceWizardEvent('space_wizard:open');
registerSpaceWizardEvent('space_wizard:cancel');
registerSpaceWizardEvent('space_wizard:confirm');
registerSpaceWizardEvent('space_wizard:navigate');
registerSpaceWizardEvent('space_wizard:link_click');
registerSpaceWizardEvent('space_wizard:space_create');
registerSpaceWizardEvent('space_wizard:space_type_change');
registerSpaceWizardEvent('space_wizard:select_plan');
registerSpaceWizardEvent('space_wizard:entered_details');

registerSSOSelfConfigurationEvent('sso:start_setup');
registerSSOSelfConfigurationEvent('sso:connection_test_result');
registerSSOSelfConfigurationEvent('sso:contact_support');
registerSSOSelfConfigurationEvent('sso:enable');

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

registerEvent('entry_editor:view', 'entry_view', EntryViewTransform);

registerEvent(
  'reference_editor_action:create',
  'feature_reference_action',
  ReferenceEditorTransform
);
registerEvent('reference_editor_action:edit', 'feature_reference_action', ReferenceEditorTransform);
registerEvent(
  'reference_editor_action:delete',
  'feature_reference_action',
  ReferenceEditorTransform
);
registerEvent('reference_editor_action:link', 'feature_reference_action', ReferenceEditorTransform);

registerEvent('ui_webhook_editor:save', 'ui_webhook_editor_save', WebhookEditorTransform);

registerEvent('text_editor:action', 'feature_text_editor', FeatureTextEditorTransform);

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
function registerEvent(event, schema, transformer) {
  _events[event] = {
    schema,
    transformer
  };
}

// Common register patterns
function registerGenericEvent(event) {
  registerEvent(event, 'generic', Generic);
}

function registerActionEvent(event, transformer) {
  registerEvent(event, snakeCase(event), transformer);
}

function registerBulkEditorEvent(event) {
  registerEvent(event, 'feature_bulk_editor', BulkEditor);
}

function registerSlideInEditorEvent(event) {
  registerEvent(event, 'slide_in_editor', SlideInEditor);
}

function registerEditorLoadEvent(event) {
  registerEvent(event, 'editor_load', EditorLoad);
}

function registerTranslationSidebarEvent(event) {
  registerEvent(event, 'translation_sidebar', TranslationSidebar);
}

function registerSnapshotEvent(event) {
  registerEvent(event, 'feature_snapshot', Snapshot);
}

function registerSpaceWizardEvent(event) {
  registerEvent(event, 'feature_space_wizard', SpaceWizardTransformer);
}

function registerSSOSelfConfigurationEvent(event) {
  registerEvent(event, 'feature_sso_self_configuration', SSOSelfConfigurationTransformer);
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
export function transform(event, data) {
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
export function getSchema(eventName) {
  const name = getAtPath(_events, [eventName, 'schema']);
  return fetchSchema(name);
}
