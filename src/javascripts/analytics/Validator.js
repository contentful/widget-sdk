import { isString, includes } from 'lodash';

// Note these names should be kept up to date with same CTA_EVENTS in trackCTA.js, defined here to avoid
// circular dependency until a better solution for constants is determined.
const CTA_EVENTS = [
  'upgrade_to_enterprise',
  'upgrade_space_plan',
  'create_space',
  'purchase_micro_small_via_support',
  'upgrade_to_team',
  'increase_team_user_limit_via_support',
  'enterprise_trial_tag',
  'trial_space_tag',
  'app_trial_tag',
  'purchase_app_via_trial',
  'delete_app_trial_space',
];

export const validEvents = {
  global: [
    'app_loaded',
    'space_changed',
    'space_left',
    'state_changed',
    'logout_clicked',
    'top_banner_dismissed',
    'navigated',
    'dialog',
  ],
  home: [
    'space_selected',
    'space_learn_selected',
    'language_selected',
    'link_opened',
    'command_copied',
  ],
  notification: ['action_performed'],
  learn: ['step_clicked', 'language_selected', 'resource_selected'],
  space_switcher: ['opened', 'create_clicked', 'space_switched'],
  space: ['template_selected', 'create'],
  space_wizard: [
    'open',
    'cancel',
    'confirm',
    'navigate',
    'link_click',
    'space_create',
    'space_type_change',
    'select_plan',
    'entered_details',
  ],
  search: [
    'bulk_action_performed',
    'search_performed',
    'view_created',
    'view_edited',
    'view_deleted',
    'view_loaded',
    'search_terms_migrated',
    'entry_clicked',
    'filter_added',
    'filter_removed',
    'query_changed',
  ],
  content_modelling: ['field_added'],
  experiment: ['start', 'interaction'],
  entry_editor: [
    'state_changed',
    'disabled_fields_visibility_toggled',
    'created_with_same_ct',
    'preview_opened',
    'view',
  ],
  entity_editor: ['edit_conflict'],
  versioning: [
    'no_snapshots',
    'snapshot_opened',
    'snapshot_closed',
    'snapshot_restored',
    'published_restored',
  ],
  content_preview: ['created', 'updated', 'deleted'],
  slide_in_editor: [
    'peek_click',
    'arrow_back',
    'bulk_editor_close',
    'open',
    'open_create',
    'delete',
  ],
  editor_load: [
    'init',
    'entity_loaded',
    'sharejs_connected',
    'doc_connected',
    'links_rendered',
    'fully_interactive',
  ],
  translation_sidebar: [
    'toggle_widget_mode',
    'deselect_active_locale',
    'update_active_locales',
    'change_focused_locale',
  ],
  // https://contentful.atlassian.net/wiki/display/PRODBulk+references+editor+-+Tracking+specs
  bulk_editor: [
    'add',
    'unlink',
    'navigate',
    'collapse',
    'expand',
    'edit_in_entry_editor',
    'open',
    'open_slide_in',
    'close',
    'status',
  ],
  content_type: ['create'],
  entry: ['create', 'publish'],
  entry_references: ['dialog_open', 'publish', 'validate'],
  release: [
    'created',
    'dialog_box_close',
    'dialog_box_open',
    'entity_added',
    'entity_removed',
    'published',
    'schedule_canceled',
    'schedule_created',
    'trashed',
    'unpublished',
    'validated',
  ],
  editor_workbench: ['tab_open'],
  asset: ['create'],
  api_key: ['create', 'clipboard_copy', 'boilerplate'],
  invite_user: ['learn', 'create_space'],
  personal_access_token: ['action'],
  element: ['click'],
  // TODO: These should be merged with the reference_editor_action
  // schema.
  reference_editor: ['create_entry', 'edit_entry'],
  account_dropdown: ['pending_tasks_fetched'],
  reference_editor_action: ['create', 'edit', 'delete', 'link'],
  incoming_links: [
    'dialog_open',
    'dialog_confirm',
    'dialog_link_click',
    'sidebar_link_click',
    'query',
  ],
  extension: ['save', 'install', 'render', 'activate', 'set_value'],
  entity_button: ['click'],
  environment_aliases: [
    'custom_alias_feedback_start',
    'custom_alias_feedback_complete',
    'custom_alias_feedback_abort',
    'opt_in_start',
    'opt_in_complete',
    'opt_in_step_1',
    'opt_in_step_2',
    'opt_in_step_3',
    'opt_in_abort_step_1',
    'opt_in_abort_step_2',
    'change_environment_open',
    'change_environment_abort',
    'notification_environment_alias_changed',
    'notification_switch_to_alias',
    'notification_continue_on_environment',
  ],
  ui_webhook_editor: ['save'],
  usage: ['period_selected', 'org_tab_selected', 'space_tab_selected', 'fair_use_policy_clicked'],
  text_editor: ['action'],
  apps: ['lifecycle_event', 'uninstallation_reason'],
  sso: ['start_setup', 'connection_test_result', 'contact_support', 'enable'],
  quick_navigation: ['opened_by_shortcut'],
  perf: ['dom_content_loaded', 'first_contentful_paint', 'time_to_interactive'],
  jobs: ['cancel', 'create'],
  teams_in_space: ['teams_added', 'users_added', 'users_to_teams_page_navigation'],
  entity_state: ['revert'],
  entity_list: ['bulk_action_performed'],
  asset_list: ['add_asset_single', 'add_asset_multiple'],
  telemetry: ['measurement'],
  app_management: ['created', 'deleted', 'updated'],
  tracking: ['invalid_event'],
  sharejs: ['cma_entity_version_mismatch'],
  feedback: ['give'],
  cta_clicked: CTA_EVENTS,
  targeted_cta_clicked: CTA_EVENTS,
  targeted_cta_impression: CTA_EVENTS,
  pricing_update: ['communication_seen'],
  space_assignment: ['change', 'continue', 'confirm', 'back'],
  space_creation: ['begin', 'continue', 'confirm', 'back', 'get_in_touch'],
  degraded_app_performance: ['modal_shown'],
  trial: [
    'trial_tag_clicked',
    'fair_use_policy_clicked',
    'get_in_touch_clicked',
    'help_link_clicked',
    'app_trial_start_clicked',
    'app_trial_created',
  ],
  space_purchase: [
    'begin',
    'cancel',
    'navigate',
    'space_plan_selected',
    'platform_selected',
    'space_type_change',
    'space_template_selected',
    'space_details_entered',
    'billing_details_entered',
    'external_link_clicked',
    'internal_link_clicked',
    'faq_section_open',
    'payment_details_entered',
    'payment_method_created',
    'confirm_purchase',
    'rename_space_clicked',
    'space_created',
    'performance_package_purchased',
    'space_template_created',
    'error',
  ],
  launch_app: ['link_clicked'],
  space_usage_summary: [
    'usage_tooltip_hovered',
    'go_to_space_home',
    'go_to_detailed_usage',
    'column_sorted',
    'pagination_changed',
    'help_link_clicked',
    'export',
  ],
};

export const validateEvent = (eventName) => {
  if (!isString(eventName)) {
    return false;
  }
  const [namespace, event] = eventName.split(':');
  const namespaceEvents = validEvents[namespace];

  return includes(namespaceEvents, event);
};
