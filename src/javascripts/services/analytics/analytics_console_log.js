'use strict';

/**
 * @ngdoc service
 * @name analytics/consoleLog
 * @description
 *
 * Similar to `noopService()`, but the track methods are replaced
 * with functions that log the events to the console. This is
 * helpful for debugging.
 */
angular.module('contentful')
.factory('analytics/consoleLog', ['$injector', function ($injector) {

  var noopAnalytics = $injector.get('analytics/noop');

  return _.extend({}, noopAnalytics, {
    track: trackStub,
    trackTotango: trackStub
  });

  function trackStub (event, data) {
    console.log('track: ' + event, data);
  }
}]);
