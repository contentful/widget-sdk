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
    trackTotango: trackStub,
    pushGtm: trackStub
  });

  function trackStub (event, data) {
    if (arguments.length === 2) {
      console.log('track: ' + event, data); // eslint-disable-line no-console
    } else {
      console.log('track:', event); // eslint-disable-line no-console
    }
  }
}]);
