import { isString, includes } from 'lodash';

export const validEvents = {
  global: [
    'app_loaded',
    'space_changed',
    'space_left',
    'state_changed',
    'logout_clicked',
    'top_banner_dismissed',
    'navigated'
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
  slide_in_editor: ['peek_click', 'arrow_back', 'open', 'open_create', 'delete'],
  // https://contentful.atlassian.net/wiki/display/PRODBulk+references+editor+-+Tracking+specs
  bulk_editor: ['add', 'open', 'open_slide_in', 'close', 'status', 'action'],
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
  markdown_editor: ['action'],
  reference_editor_action: ['create', 'edit', 'delete', 'link'],
  incoming_links: [
    'dialog_open',
    'dialog_confirm',
    'dialog_link_click',
    'sidebar_link_click',
    'query'
  ],
  extension: ['save', 'install'],
  entity_button: ['click'],
  ui_webhook_editor: ['save'],
  usage: ['period_selected'],
  text_editor: ['action'],
  apps: ['opted_in'],
  netlify: [
    'connected',
    'installed',
    'updated',
    'uninstalled',
    'build_triggered',
    'preview_opened'
  ],
  algolia: ['installed', 'updated', 'uninstalled']
};

export const validateEvent = eventName => {
  if (!isString(eventName)) {
    return false;
  }
  const [namespace, event] = eventName.split(':');
  const namespaceEvents = validEvents[namespace];

  return includes(namespaceEvents, event);
};
