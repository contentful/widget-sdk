'use strict';

/**
 * @ngdoc service
 * @name analytics
 * @description
 *
 * This service provides an object with different methods to trigger
 * analytics events.
 *
 * The service is disabled in all but the production environment.
 * It can be enabled by appending the '?forceAnalytics' query string to
 * the URL.
 * In the development environment you can send all tracking events to
 * the console for testing by using '?forceAnalyticsDevMode'.
 */
angular.module('contentful')
.factory('analytics', ['$injector', function ($injector) {

  var $location = $injector.get('$location');
  var environment = $injector.get('environment');

  var serviceName;

  if (forceDevMode()) {
    serviceName = 'analytics/consoleLog';
  } else if (shouldLoadAnalytics()) {
    serviceName = 'analytics/track';
  } else {
    serviceName = 'analytics/noop';
  }

  return $injector.get(serviceName);

  function shouldLoadAnalytics () {
    var load = _.includes(['production', 'staging'], environment.env);
    return load || $location.search().forceAnalytics;
  }

  function forceDevMode () {
    return $location.search().forceAnalyticsDevMode;
  }
}]);
