'use strict';

angular.module('contentful')

/**
 * When adding a new event, please extend the guide:
 * ${UI_REPO_ROOT}/docs/guides/analytics.md
 */
.constant('analytics/validEvents', {
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
  notification: [
    'action_performed'
  ],
  learn: [
    'step_clicked',
    'language_selected',
    'resource_selected'
  ],
  space_switcher: [
    'opened',
    'create_clicked',
    'space_switched'
  ],
  space: [
    'template_selected',
    'create'
  ],
  search: [
    'view_folder_added',
    'view_folder_deleted',
    'view_added',
    'view_deleted',
    'bulk_action_performed'
  ],
  modelling: [
    'field_added',
    'custom_extension_selected'
  ],
  entry_editor: [
    'state_changed',
    'disabled_fields_visibility_toggled',
    'created_with_same_ct',
    'preview_opened',
    'custom_extension_rendered'
  ],
  api_keys: [
    'create_screen_opened',
    'language_selected'
  ],
  versioning: [
    'no_snapshots',
    'snapshot_opened',
    'snapshot_closed',
    'snapshot_restored',
    'published_restored'
  ],
  content_preview: [
    'created',
    'updated',
    'deleted'
  ],
  paywall: [
    'viewed',
    'closed',
    'upgrade_clicked'
  ],
  // https://contentful.atlassian.net/wiki/display/PROD/Bulk+references+editor+-+Tracking+specs
  bulk_editor: [
    'add',
    'open',
    'close',
    'status',
    'action'
  ],
  content_type: [
    'create'
  ],
  entry: [
    'create'
  ],
  asset: [
    'create'
  ],
  api_key: [
    'create'
  ]
})

/**
 * @ngdoc service
 * @name analytics/validateEvent
 * @description
 * Validates an event name against the data
 * defined in `analytics/validEvents`.
 */
.factory('analytics/validateEvent', ['require', function (require) {
  var validEvents = require('analytics/validEvents');

  return function validateEvent (eventName) {
    eventName = _.isString(eventName) ? eventName : '';
    var parts = eventName.split(':');
    var namespace = parts[0] || null;
    var event = parts[1] || null;
    var namespaceEvents = validEvents[namespace];

    return _.isArray(namespaceEvents) && namespaceEvents.indexOf(event) > -1;
  };
}]);
