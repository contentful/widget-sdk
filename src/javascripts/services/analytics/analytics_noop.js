'use strict';

/**
 * @ngdoc service
 * @name analytics/noop
 * @description
 *
 * Returns an object with the same interface as the proper
 * analytics service, except that all functions are replaced by
 * noops.
 */
angular.module('contentful')

.factory('analytics/noop', ['require', function (require) {

  var analyticsAnalytics = require('analytics/track');
  var analyticsConsole = require('analytics/console');

  var service = _.mapValues(analyticsAnalytics, _.constant(_.noop));

  service.track = function (name, data) {
    analyticsConsole.add(name, 'Segment', data);
  };

  service.pushGtm = function (data) {
    analyticsConsole.add(data.event || 'No event name', 'GTM', _.omit(data || {}, 'event'));
  };

  return service;
}]);
