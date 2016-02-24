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
.factory('analytics/noop', ['$injector', function ($injector) {

  var analyticsAnalytics = $injector.get('analytics/track');

  return _.mapValues(analyticsAnalytics, _.constant(_.noop));
}]);
