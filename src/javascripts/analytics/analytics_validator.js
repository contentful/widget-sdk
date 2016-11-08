'use strict';

angular.module('contentful')

.constant('analytics/validEvents', {
  global: [
    'app_loaded',
    'space_changed',
    'space_left',
    'state_changed',
    'persona_selected'
  ],
  versioning: [
    'no_snapshots',
    'snapshot_opened',
    'snapshot_closed',
    'snapshot_restored',
    'published_restored'
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
