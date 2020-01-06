import { isString, includes } from 'lodash';

export const validEvents = {
  global: [
    'app_loaded',
    'space_changed',
    'space_left',
    'state_changed',
    'logout_clicked',
    'top_banner_dismissed',
    'navigated',
    'dialog'
  ],
  home: [
    'space_selected',
    'space_learn_selected',
    'language_selected',
    'link_opened',
    'command_copied'
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
    'entered_details'
  ],
  search: [
    'bulk_action_performed',
    'search_performed',
    'view_created',
    'view_edited',
    'view_deleted',
    'view_loaded',
    'search_terms_migrated'
  ],
  modelling: ['field_added'],
  experiment: ['start', 'interaction'],
  entry_editor: [
    'state_changed',
    'disabled_fields_visibility_toggled',
    'created_with_same_ct',
    'preview_opened',
    'view'
  ],
  versioning: [
    'no_snapshots',
    'snapshot_opened',
    'snapshot_closed',
    'snapshot_restored',
    'published_restored'
  ],
  content_preview: ['created', 'updated', 'deleted'],
  slide_in_editor: [
    'peek_click',
    'arrow_back',
    'bulk_editor_close',
    'open',
    'open_create',
    'delete'
  ],
  editor_load: [
    'init',
    'entity_loaded',
    'sharejs_connected',
    'links_rendered',
    'fully_interactive'
  ],
  translation_sidebar: [
    'toggle_widget_mode',
    'deselect_active_locale',
    'update_active_locales',
    'change_focused_locale'
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
    'status'
  ],
  content_type: ['create'],
  entry: ['create', 'publish'],
  asset: ['create'],
  api_key: ['create', 'clipboard_copy', 'boilerplate'],
  invite_user: ['learn', 'create_space'],
  personal_access_token: ['action'],
  element: ['click'],
  // TODO: These should be merged with the reference_editor_action
  // schema.
  reference_editor: ['create_entry', 'edit_entry'],
  account_dropdown: ['pending_tasks_fetched'],
  markdown_editor: ['action'],
  reference_editor_action: ['create', 'edit', 'delete', 'link'],
  incoming_links: [
    'dialog_open',
    'dialog_confirm',
    'dialog_link_click',
    'sidebar_link_click',
    'query'
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
    'notification_continue_on_environment'
  ],
  ui_webhook_editor: ['save'],
  usage: ['period_selected'],
  text_editor: ['action'],
  apps: ['lifecycle_event', 'uninstallation_reason'],
  sso: ['start_setup', 'connection_test_result', 'contact_support', 'enable'],
  quick_navigation: ['opened_by_shortcut'],
  ie11_deprecation_notice: ['shown'],
  perf: ['dom_content_loaded', 'first_contentful_paint', 'time_to_interactive'],
  jobs: ['cancel', 'create'],
  teams_in_space: ['teams_added', 'users_added', 'users_to_teams_page_navigation'],
  entity_state: ['revert'],
  asset_list: ['add_asset_single', 'add_asset_multiple']
};

export const validateEvent = eventName => {
  if (!isString(eventName)) {
    return false;
  }
  const [namespace, event] = eventName.split(':');
  const namespaceEvents = validEvents[namespace];

  return includes(namespaceEvents, event);
};