import { snakeCase } from 'lodash';
import { getSnowplowSchema } from './SchemasSnowplow';
import * as segmentTypewriterPlans from './events';
import { TransformedEventData, EventData } from './types';

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
  segmentExperimentSchema?: string;
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

registerEvent('space:create', { snowplow: 'space_create', segment: 'space_created' }, SpaceCreate);
registerEvent(
  'entry:create',
  { snowplow: 'entry_create', segment: 'entry_created' },
  EntryActionV2
);
registerEvent(
  'entry:publish',
  { snowplow: 'entry_publish', segment: 'entry_published' },
  EntryActionV2
);

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

registerGenericEvent('perf:dom_content_loaded');
registerGenericEvent('perf:first_contentful_paint');
registerGenericEvent('perf:time_to_interactive');

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

registerSegmentEvent(
  'release:dialog_box_open',
  'release_dialog_box',
  ReleasesTransformer.releaseDialogOpen
);
registerSegmentEvent(
  'release:dialog_box_close',
  'release_dialog_box',
  ReleasesTransformer.releaseDialogClose
);
registerSegmentEvent(
  'release:entity_added',
  'release_entity_added',
  ReleasesTransformer.releaseEntityAdded
);
registerSegmentEvent(
  'release:entity_removed',
  'release_entity_removed',
  ReleasesTransformer.releaseEntityRemoved
);
registerSegmentEvent('release:created', 'release_created', ReleasesTransformer.releaseCreated);
registerSegmentEvent('release:trashed', 'release_trashed', ReleasesTransformer.releaseTrashed);
registerSegmentEvent(
  'release:validated',
  'release_validated',
  ReleasesTransformer.releaseValidated
);
registerSegmentEvent(
  'release:published',
  'release_published',
  ReleasesTransformer.releasePublished
);
registerSegmentEvent(
  'release:unpublished',
  'release_unpublished',
  ReleasesTransformer.releaseUnpublished
);
registerSegmentEvent(
  'release:schedule_created',
  'release_schedule_created',
  ReleasesTransformer.releaseScheduleCreated
);
registerSegmentEvent(
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

registerSegmentEvent('search:entry_clicked', 'search_entry_clicked', SearchAndViewsWithSequence);
registerSegmentEvent('search:filter_added', 'search_filter_added', SearchAndViewsWithSequence);
registerSegmentEvent('search:filter_removed', 'search_filter_removed', SearchAndViewsWithSequence);
// TODO: Re-implement tracking or remove:
registerSegmentEvent('search:query_changed', 'search_query_changed', SearchAndViewsWithSequence);

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

registerGenericEvent('onboarding_explore:continue');
registerGenericEvent('space_home:onboarding_explore');
registerGenericEvent('onboarding_explore:dev_docs');
registerGenericEvent('onboarding_explore:training_center');
registerGenericEvent('onboarding_sample_space:continue');
registerGenericEvent('onboarding_sample_space:back');
registerGenericEvent('onboarding_gatsby_blog:back');
registerGenericEvent('space_home:onboarding_discover');
registerGenericEvent('onboarding_replace:cancel');
registerGenericEvent('onboarding_replace:replace');

/**
 * @deprecated We're migrating away from Snowplow to Segment
 */
function registerSnowplowEvent(event: string, schema: string, transformer: Transformer) {
  // Use Snowplow schemas 1:1 in Segment for legacy web app events.
  // For "generic" events we use the internal web app event ID, e.g. `global:space_changed` instead of `generic`.
  const segmentSchema = schema === 'generic' ? snakeCase(event) : schema;

  // TODO: Ideally the `event` would be available as context in the `segment_contentful.tracks` table.
  registerEvent(event, { snowplow: schema, segment: segmentSchema }, transformer);
}

/**
 * @deprecated Do not register transformers for new Segment events. Instead use `Analytics.tracking.fooBar()`
 *  which gets exposed to track your new event after a tracking plan for `foo_bar` has been added to the
 *  segment-schema-registry and after `npm run segment`.
 */
function registerSegmentEvent(event: string, schema: string, transformer: Transformer) {
  return registerEvent(event, { segment: schema }, transformer);
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
 * @param {strong} event Name passed to `analytics.track()`
 * @param {string} schema Name of the Snowplow/Segment schemas. Snowplow is optional as we're deprecating the service.
 * @param {Transformer} transformer
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
  return {
    /**
     * When enabled, `Analytics.track()` for the event will result in two segment.track() calls. The additional call
     * will include an experimental event payload that should solve our main Segment migration issues for legacy
     * web app events.
     *
     * @param customSchemaName? Allows to define a custom schema that the experimental tracking payload should
     *  be tracked for. By default, this is the Segment schema name unless it is a "generic" event in which case
     *  it is the web app's `event` ID, e.g. `global:space_changed` instead of `generic`.
     * In case the experiment schema.
     */
    enableSegmentExperiment: (customSchemaName?: string) => {
      const defaultExperimentSchema = schema.snowplow === 'generic' ? event : schema.snowplow;
      const experimentSchema = customSchemaName || defaultExperimentSchema;
      if (snakeCase(experimentSchema) === snakeCase(schema.segment)) {
        throw new Error(
          'Can not use segment experiment schema equal to default segment tracking schema. This ' +
            'would result in both segment.track() calls ending up in the same table. Provide a `customSchemaName`'
        );
      }
      _events[event].segmentExperimentSchema = experimentSchema;
    },
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
  return registerSnowplowEvent(event, 'slide_in_editor', SlideInEditor);
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
  // TODO: Define proper schema(s) for these events and don't send entire domain objects!
  registerSegmentEvent(event, snakeCase(event), SpacePurchaseTransformer);
}

function registerSSOSelfConfigurationEvent(event) {
  registerSnowplowEvent(event, 'feature_sso_self_configuration', SSOSelfConfigurationTransformer);
}

function registerEnvironmentAliasesEvent(event) {
  registerSnowplowEvent(event, 'environment_aliases', EnvironmentAliases);
}

export function eventExists(event) {
  return !!_events[event];
}

/**
 * Returns event data transformed, suitable for `snowplow.track()`.
 * This data can be used with `segment.track()` by passing it to `transformSnowplowToSegmentData()` first.
 */
export function transformEventForSnowplow(event: string, data: EventData): TransformedEventData {
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
  const snowplowSchema = getSnowplowSchemaForEvent(event);
  return { name: schemaName, isLegacySnowplowGeneric: snowplowSchema?.name === 'generic' };
}
