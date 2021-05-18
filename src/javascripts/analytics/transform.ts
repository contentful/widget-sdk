import { get as getAtPath, snakeCase } from 'lodash';
import { getSnowplowSchema } from './SchemasSnowplow';
import * as segmentTypewriterPlans from './events';
import { getSegmentSchema } from './SchemasSegment';
import { TransformedEventData, EventData } from './types';

import EntityAction from './transformers/EntityAction';
import EntryActionV2 from './transformers/EntryActionV2';
import Generic from './transformers/Generic';
import SpaceCreate from './transformers/SpaceCreate';
import SpaceWizardTransformer from './transformers/SpaceWizard';
import createExperimentTransformer from './transformers/Experiment';
import PageViewTransform from './transformers/PageView';
import { BoilerplateTransform, ClipboardCopyTransform } from './transformers/ApiKey';
import AppOpen from './transformers/AppOpen';
import BulkEditor from './transformers/BulkEditor';
import SlideInEditor from './transformers/SlideInEditor';
import TranslationSidebar from './transformers/TranslationSidebar';
import Snapshot from './transformers/Snapshot';
import InviteUserExperiment from './transformers/InviteUserExperiment';
import SearchAndViews from './transformers/SearchAndViews';
import ElementClickTransform from './transformers/ElementClick';
import EntryViewTransform from './transformers/EntryView';
import EntityEditorConflictTransform from './transformers/EntityEditorConflict';
import ReferenceEditorTransform from './transformers/ReferenceEditor';
import ExtensionSaveTransform from './transformers/ExtensionSave';
import ExtensionInstallTransform from './transformers/ExtensionInstall';
import WebhookEditorTransform from './transformers/WebhookEditor';
import FeatureTextEditorTransform from './transformers/FeatureTextEditor';
import SSOSelfConfigurationTransformer from './transformers/SSOSelfConfiguration';
import ExtensionRenderTransformer from './transformers/ExtensionRender';
import ExtensionActivationTransformer from './transformers/ExtensionActivation';
import ExtensionSetValueTransformer from './transformers/ExtensionSetValue';
import {
  AppLifecycleEventTransformer,
  AppUninstallationReasonTransformer,
} from './transformers/Apps';
import DialogTransformer from './transformers/Dialog';
import JobsCreateTransformer from './transformers/JobsCreate';
import JobsCancelTransformer from './transformers/JobsCancel';
import EnvironmentAliases from './transformers/EnvironmentAliases';
import SpacePurchaseTransformer from './transformers/SpacePurchase';
import * as ReleasesTransformer from './transformers/Releases';
import { withSequenceContext } from './sequenceContext';

type Transformer = Function | { (event: string, data: EventData): TransformedEventData };

type EventMeta = {
  transformer: Transformer;
  segmentSchema?: string;
  snowplowSchema?: string;
};

const planNames = Object.keys(segmentTypewriterPlans);

/**
 * Registers each analytics event which should be sent to Snowplow/Segment with a
 * corresponding schema and transformer name. Exports functions to obtain the
 * schema and transformer for a given event.
 *
 * See the documentation of `registerEvent()` on how to register an event.
 */
const _events: Record<string, EventMeta> = {};

/////////////////////////////////////////////////////////////////////////
// MIGRATED events that now use `Analytics.tracking.` without transform:
/////////////////////////////////////////////////////////////////////////

migratedLegacyEvent('editorLoaded', 'editor_load');

/////////////////////////////////////////////////////////////////////////
// LEGACY Analytis.track() transform based event registration:
/////////////////////////////////////////////////////////////////////////

registerSnowplowEvent('element:click', 'element_click', ElementClickTransform);
registerSnowplowEvent('global:state_changed', 'page_view', PageViewTransform);

registerGenericEvent('global:space_changed');
registerGenericEvent('global:space_left');

registerSnowplowEvent('extension:save', 'ui_extension_save', ExtensionSaveTransform);
registerSnowplowEvent('extension:install', 'ui_extension_install', ExtensionInstallTransform);
registerSnowplowEvent('extension:render', 'generic', ExtensionRenderTransformer);
registerSnowplowEvent('extension:activate', 'extension_activate', ExtensionActivationTransformer);
registerSnowplowEvent('extension:set_value', 'extension_set_value', ExtensionSetValueTransformer);

registerSnowplowEvent('apps:lifecycle_event', 'app_lifecycle_event', AppLifecycleEventTransformer);
registerSnowplowEvent(
  'apps:uninstallation_reason',
  'app_uninstallation_reason',
  AppUninstallationReasonTransformer
);

registerGenericEvent('learn:language_selected');
registerGenericEvent('learn:resource_selected');
registerGenericEvent('learn:step_clicked');

registerGenericEvent('reference_editor:create_entry');
registerGenericEvent('reference_editor:edit_entry');

registerGenericEvent('entity_button:click');

registerGenericEvent('incoming_links:dialog_open');
registerGenericEvent('incoming_links:dialog_confirm');
registerGenericEvent('incoming_links:dialog_link_click');
registerGenericEvent('incoming_links:sidebar_link_click');
registerGenericEvent('incoming_links:query');

registerEnvironmentAliasesEvent('environment_aliases:custom_alias_feedback_start');
registerEnvironmentAliasesEvent('environment_aliases:custom_alias_feedback_complete');
registerEnvironmentAliasesEvent('environment_aliases:custom_alias_feedback_abort');
registerEnvironmentAliasesEvent('environment_aliases:opt_in_start');
registerEnvironmentAliasesEvent('environment_aliases:opt_in_complete');
registerEnvironmentAliasesEvent('environment_aliases:opt_in_step_1');
registerEnvironmentAliasesEvent('environment_aliases:opt_in_step_2');
registerEnvironmentAliasesEvent('environment_aliases:opt_in_step_3');
registerEnvironmentAliasesEvent('environment_aliases:opt_in_abort_step_1');
registerEnvironmentAliasesEvent('environment_aliases:opt_in_abort_step_2');
registerEnvironmentAliasesEvent('environment_aliases:change_environment_open');
registerEnvironmentAliasesEvent('environment_aliases:change_environment_abort');
registerEnvironmentAliasesEvent('environment_aliases:notification_environment_alias_changed');
registerEnvironmentAliasesEvent('environment_aliases:notification_environment_alias_created');
registerEnvironmentAliasesEvent('environment_aliases:notification_environment_alias_deleted');
registerEnvironmentAliasesEvent('environment_aliases:notification_switch_to_alias');
registerEnvironmentAliasesEvent('environment_aliases:notification_continue_on_environment');

registerGenericEvent('usage:period_selected');
registerGenericEvent('usage:org_tab_selected');
registerGenericEvent('usage:space_tab_selected');
registerGenericEvent('usage:fair_use_policy_clicked');

registerGenericEvent('v1_migration_update:communication_seen');

registerGenericEvent('space_assignment:change');
registerGenericEvent('space_assignment:continue');
registerGenericEvent('space_assignment:confirm');
registerGenericEvent('space_assignment:back');

registerGenericEvent('space_creation:begin');
registerGenericEvent('space_creation:continue');
registerGenericEvent('space_creation:confirm');
registerGenericEvent('space_creation:back');
registerGenericEvent('space_creation:get_in_touch');

registerGenericEvent('high_value_feature:modal_help_center_cta');
registerGenericEvent('high_value_feature:modal_learn_more_cta');
registerGenericEvent('high_value_feature:modal_close');
registerGenericEvent('high_value_feature:click');
registerGenericEvent('high_value_feature:hover');

registerGenericEvent('quick_navigation:opened_by_shortcut');

registerGenericEvent('trial:trial_tag_clicked');
registerGenericEvent('trial:fair_use_policy_clicked');
registerGenericEvent('trial:get_in_touch_clicked');
registerGenericEvent('trial:help_link_clicked');
registerGenericEvent('trial:app_trial_start_clicked');
registerGenericEvent('trial:app_trial_start_performance');
registerGenericEvent('trial:app_trial_started');

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

registerSnapshotEvent('versioning:no_snapshots');
registerSnapshotEvent('versioning:snapshot_opened');
registerSnapshotEvent('versioning:snapshot_closed');
registerSnapshotEvent('versioning:snapshot_restored');
registerSnapshotEvent('versioning:published_restored');

registerSnowplowEvent('api_key:clipboard_copy', 'api_key', ClipboardCopyTransform);
registerSnowplowEvent('api_key:boilerplate', 'boilerplate', BoilerplateTransform);

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

registerGenericEvent('cta_clicked:upgrade_space_plan');
registerGenericEvent('cta_clicked:create_space');
registerGenericEvent('cta_clicked:upgrade_to_enterprise');
registerGenericEvent('cta_clicked:purchase_micro_small_via_support');

registerGenericEvent('targeted_cta_clicked:upgrade_to_enterprise');
registerGenericEvent('targeted_cta_clicked:upgrade_space_plan');
registerGenericEvent('targeted_cta_clicked:create_space');
registerGenericEvent('targeted_cta_clicked:purchase_micro_small_via_support');
registerGenericEvent('targeted_cta_clicked:upgrade_to_team');
registerGenericEvent('targeted_cta_clicked:increase_team_user_limit_via_support');
registerGenericEvent('targeted_cta_clicked:delete_app_trial_space');
registerGenericEvent('targeted_cta_clicked:purchase_app_via_trial');

registerGenericEvent('targeted_cta_impression:upgrade_to_enterprise');
registerGenericEvent('targeted_cta_impression:upgrade_space_plan');
registerGenericEvent('targeted_cta_impression:create_space');
registerGenericEvent('targeted_cta_impression:purchase_micro_small_via_support');
registerGenericEvent('targeted_cta_impression:upgrade_to_team');
registerGenericEvent('targeted_cta_impression:increase_team_user_limit_via_support');
registerGenericEvent('targeted_cta_impression:enterprise_trial_tag');
registerGenericEvent('targeted_cta_impression:trial_space_tag');
registerGenericEvent('targeted_cta_impression:app_trial_tag');
registerGenericEvent('targeted_cta_impression:delete_app_trial_space');
registerGenericEvent('targeted_cta_impression:purchase_app_via_trial');

registerSnowplowEvent('global:app_loaded', 'app_open', AppOpen);
registerGenericEvent('global:logout_clicked');

registerSnowplowEvent('invite_user:learn', 'generic', InviteUserExperiment);
registerSnowplowEvent('invite_user:create_space', 'generic', InviteUserExperiment);

registerGenericEvent('perf:dom_content_loaded');
registerGenericEvent('perf:first_contentful_paint');
registerGenericEvent('perf:time_to_interactive');

registerGenericEvent('entity_state:revert');
registerGenericEvent('entity_list:bulk_action_performed');
registerGenericEvent('asset_list:add_asset_single');
registerGenericEvent('asset_list:add_asset_multiple');
registerGenericEvent('content_modelling:field_added');

registerGenericEvent('teams_in_space:teams_added');
registerGenericEvent('teams_in_space:users_added');
registerGenericEvent('teams_in_space:users_to_teams_page_navigation');

registerGenericEvent('account_dropdown:pending_tasks_fetched');

registerGenericEvent('content_preview:created');
registerGenericEvent('content_preview:updated');
registerGenericEvent('content_preview:deleted');

registerGenericEvent('launch_app:link_clicked');

registerSnowplowEvent(
  'release:dialog_box_open',
  'release_dialog_box',
  ReleasesTransformer.releaseDialogOpen
);
registerSnowplowEvent(
  'release:dialog_box_close',
  'release_dialog_box',
  ReleasesTransformer.releaseDialogClose
);
registerSnowplowEvent(
  'release:entity_added',
  'release_entity_added',
  ReleasesTransformer.releaseEntityAdded
);
registerSnowplowEvent(
  'release:entity_removed',
  'release_entity_removed',
  ReleasesTransformer.releaseEntityRemoved
);
registerSnowplowEvent('release:created', 'release_created', ReleasesTransformer.releaseCreated);
registerSnowplowEvent('release:trashed', 'release_trashed', ReleasesTransformer.releaseTrashed);
registerSnowplowEvent(
  'release:validated',
  'release_validated',
  ReleasesTransformer.releaseValidated
);
registerSnowplowEvent(
  'release:published',
  'release_published',
  ReleasesTransformer.releasePublished
);
registerSnowplowEvent(
  'release:unpublished',
  'release_unpublished',
  ReleasesTransformer.releaseUnpublished
);
registerSnowplowEvent(
  'release:schedule_created',
  'release_schedule_created',
  ReleasesTransformer.releaseScheduleCreated
);
registerSnowplowEvent(
  'release:schedule_canceled',
  'release_schedule_canceled',
  ReleasesTransformer.releaseScheduleCanceled
);

registerSnowplowEvent('personal_access_token:action', 'personal_access_token', (_, data) => {
  return {
    data: {
      personal_access_token_id: data.patId,
      action: data.action,
      executing_user_id: data.userId,
    },
  };
});

registerSnowplowEvent('feedback:give', 'generic', (_, data) => {
  return {
    data: {
      scope: 'feedback',
      action: data.target,
      payload: { about: data.about, feedback: data.feedback },
      organization_id: data.organizationId,
      space_id: data.spaceId,
      executing_user_id: data.userId,
    },
  };
});

const SearchAndViewsWithSequence = (event, data) =>
  SearchAndViews(event, withSequenceContext(data));

registerSnowplowEvent('search:search_performed', 'search_perform', SearchAndViewsWithSequence);
registerSnowplowEvent('search:view_created', 'view_create', SearchAndViews);
registerSnowplowEvent('search:view_edited', 'view_edit', SearchAndViews);
registerSnowplowEvent('search:view_deleted', 'view_delete', SearchAndViews);
registerSnowplowEvent('search:view_loaded', 'view_load', SearchAndViewsWithSequence);
registerSnowplowEvent('search:search_terms_migrated', 'ui_config_migrate', SearchAndViews);

registerSnowplowEvent('search:entry_clicked', 'ui_click', SearchAndViewsWithSequence);
registerSnowplowEvent('search:filter_added', 'ui_click', SearchAndViewsWithSequence);
registerSnowplowEvent('search:filter_removed', 'ui_click', SearchAndViewsWithSequence);
registerSnowplowEvent('search:query_changed', 'ui_click', SearchAndViewsWithSequence);

registerSnowplowEvent('entry_editor:view', 'entry_view', EntryViewTransform);
registerGenericEvent('entry_editor:disabled_fields_visibility_toggled');
registerGenericEvent('entry_editor:created_with_same_ct');

registerSnowplowEvent(
  'entity_editor:edit_conflict',
  'entity_editor_edit_conflict',
  EntityEditorConflictTransform
);

registerSegmentEvent(
  'reference_editor_action:create',
  'feature_reference_action',
  ReferenceEditorTransform
);
registerSegmentEvent(
  'reference_editor_action:edit',
  'feature_reference_action',
  ReferenceEditorTransform
);
registerSegmentEvent(
  'reference_editor_action:delete',
  'feature_reference_action',
  ReferenceEditorTransform
);
registerSegmentEvent(
  'reference_editor_action:link',
  'feature_reference_action',
  ReferenceEditorTransform
);

registerSnowplowEvent('ui_webhook_editor:save', 'ui_webhook_editor_save', WebhookEditorTransform);

registerSnowplowEvent('text_editor:action', 'feature_text_editor', FeatureTextEditorTransform);

registerSnowplowEvent('global:dialog', 'dialog', DialogTransformer);
registerSnowplowEvent('jobs:create', 'jobs_create', JobsCreateTransformer);
registerSnowplowEvent('jobs:cancel', 'jobs_cancel', JobsCancelTransformer);

registerGenericEvent('telemetry:measurement');

registerGenericEvent('app_management:created');
registerGenericEvent('app_management:deleted');
registerGenericEvent('app_management:updated');

registerGenericEvent('widget_renderer:fallback_warning_shown');
registerGenericEvent('widget_renderer:fallback_rendered');

registerGenericEvent('tracking:invalid_event');
registerGenericEvent('entry_references:dialog_open');
registerGenericEvent('entry_references:publish');
registerGenericEvent('entry_references:validate');
registerGenericEvent('editor_workbench:tab_open');

registerGenericEvent('degraded_app_performance:modal_shown');

registerSpacePurchaseEvent('space_purchase:begin');
registerSpacePurchaseEvent('space_purchase:cancel');
registerSpacePurchaseEvent('space_purchase:navigate');
registerSpacePurchaseEvent('space_purchase:space_plan_selected');
registerSpacePurchaseEvent('space_purchase:platform_selected');
registerSpacePurchaseEvent('space_purchase:space_template_selected');
registerSpacePurchaseEvent('space_purchase:space_details_entered');
registerSpacePurchaseEvent('space_purchase:billing_details_entered');
registerSpacePurchaseEvent('space_purchase:payment_details_entered');
registerSpacePurchaseEvent('space_purchase:payment_method_created');
registerSpacePurchaseEvent('space_purchase:external_link_clicked');
registerSpacePurchaseEvent('space_purchase:internal_link_clicked');
registerSpacePurchaseEvent('space_purchase:faq_section_open');
registerSpacePurchaseEvent('space_purchase:confirm_purchase');
registerSpacePurchaseEvent('space_purchase:rename_space_clicked');
registerSpacePurchaseEvent('space_purchase:space_created');
registerSpacePurchaseEvent('space_purchase:performance_package_purchased');
registerSpacePurchaseEvent('space_purchase:space_type_change');
registerSpacePurchaseEvent('space_purchase:space_template_created');
registerSpacePurchaseEvent('space_purchase:error');

registerGenericEvent('space_usage_summary:usage_tooltip_hovered');
registerGenericEvent('space_usage_summary:go_to_space_home');
registerGenericEvent('space_usage_summary:go_to_detailed_usage');
registerGenericEvent('space_usage_summary:column_sorted');
registerGenericEvent('space_usage_summary:pagination_changed');
registerGenericEvent('space_usage_summary:help_link_clicked');
registerGenericEvent('space_usage_summary:export');

/**
 * @deprecated We're migrating away from Snowplow to Segment
 */
function registerSnowplowEvent(event: string, schema: string, transformer: Transformer) {
  registerEvent(event, { snowplow: schema, segment: event }, transformer);
}

/**
 * @deprecated Do not register transformers for new Segment events. Instead use `Analytics.tracking.fooBar()`
 *  which gets exposed to track your new event after a tracking plan for `foo_bar` has been added to the
 *  segment-schema-registry and after `npm run segment`.
 */
function registerSegmentEvent(event: string, schema: string, transformer: Transformer) {
  registerEvent(event, { segment: schema }, transformer);
}

/**
 * Signals that events for a given Snowplow schema should no longer be tracked via `Analytics.track()` but
 * via `Analytics.tracking.` which is taking advantage of Segment's typewriter and doesn't rely on transformers.
 * If the legacy Snowplow event is registered via this function then the event will be tracked to Snowplow until
 * the service gets deprecated for good.
 *
 * @param segmentPlanFnName
 * @param snowplowSchemaName
 */
function migratedLegacyEvent(
  segmentPlanFnName: keyof typeof segmentTypewriterPlans,
  snowplowSchemaName: string
) {
  if (!planNames.includes(segmentPlanFnName)) {
    throw new Error(`"${segmentPlanFnName}" is not a known Segment plan tracking function`);
  }
  _events[segmentPlanFnName] = {
    snowplowSchema: snowplowSchemaName,
    transformer: (data) => data,
  };
}

/**
 * Registers an event to be tracked by snowplow.
 * @param event
 *   Name passed to `analytics.track()`
 * @param schema
 *   Name of the schemas to put the data into. Snowplow schema must be registered in `analytics/snowplow/Schemas`.
 *   Omitting the `snowplow` param stops the event tracking to Snowplow.
 * @param transformer
 *   A function to transform the parameters passed to `analytics.track()` to the
 *   data send to snowplow.
 *   Accepts two arguments, the event name and the tracking data. The tracking
 *   data is the second argument of `analytics.track()` merged with common
 *   payload defined in `analytics/Analytics`.
 *   Returns an object with a `data` and optional `context` property.
 */
function registerEvent(
  event: string,
  schema: { segment: string; snowplow?: string },
  transformer: Transformer
) {
  _events[event] = {
    segmentSchema: schema.segment,
    snowplowSchema: schema.snowplow,
    transformer,
  };
}

// Common register patterns
function registerGenericEvent(event) {
  registerSnowplowEvent(event, 'generic', Generic);
}

function registerActionEvent(event, transformer) {
  registerSnowplowEvent(event, snakeCase(event), transformer);
}

function registerBulkEditorEvent(event) {
  registerSnowplowEvent(event, 'feature_bulk_editor', BulkEditor);
}

function registerSlideInEditorEvent(event) {
  registerSnowplowEvent(event, 'slide_in_editor', SlideInEditor);
}

function registerTranslationSidebarEvent(event) {
  registerSnowplowEvent(event, 'translation_sidebar', TranslationSidebar);
}

function registerSnapshotEvent(event) {
  registerSnowplowEvent(event, 'feature_snapshot', Snapshot);
}

function registerSpaceWizardEvent(event) {
  registerSnowplowEvent(event, 'feature_space_wizard', SpaceWizardTransformer);
}

function registerSpacePurchaseEvent(event) {
  registerSnowplowEvent(event, 'space_purchase', SpacePurchaseTransformer);
}

function registerSSOSelfConfigurationEvent(event) {
  registerSnowplowEvent(event, 'feature_sso_self_configuration', SSOSelfConfigurationTransformer);
}

function registerEnvironmentAliasesEvent(event) {
  registerSnowplowEvent(event, 'environment_aliases', EnvironmentAliases);
}

export function eventExists(eventName) {
  return !!getAtPath(_events, [eventName]);
}

/**
 * Returns data transformed for Snowplow/Segment
 */
export function transformEvent(event: string, data: EventData): TransformedEventData {
  const transformer = _events[event].transformer;
  return transformer(event, data);
}

export function getSnowplowSchemaForEvent(event: string) {
  const schemaName = _events[event]?.snowplowSchema;
  if (!schemaName) {
    // Event is already tracked via `Analytics.tracking.` and without a `migratedLegacyEvent()`
    // Snowplow fallback, e.g. because it's a new Segment only event or no longer needed in Snowplow.
    return null;
  }
  return getSnowplowSchema(schemaName);
}

export function getSegmentSchemaForEvent(event: string) {
  const schemaName = _events[event]?.segmentSchema;
  if (!schemaName) {
    // Event is already tracked via `Analytics.tracking.` so it's no longer registered here.
    return null;
  }
  const schema = getSegmentSchema(schemaName);
  if (schema) {
    return schema;
  }
  // Segment schemas that aren't registered explicitly are assumed to exist due to the Segment -> Snowplow migration.
  // Schemas were auto generated and named after the internal web app event names. Due to a previous tracking bug
  // their data is required to be wrapped in an additional `{ data }`.
  // TODO: Register all schemas explicitly, note which ones were migrated.
  return { name: schemaName, version: '1', wrapPayloadInData: true };
}
