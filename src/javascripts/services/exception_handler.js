'use strict';

/**
 * This service defines the function that handles uncaught exceptions
 * in Angular’s digest loop.
 *
 * We call logger.logExceptions which logs the exception to the console
 * and to bugsnag if it is enabled.
 *
 * If we are not in development we also show an error dialog that
 * notifies the user that the app has crashed.
 */
angular.module('contentful')
.factory('$exceptionHandler', ['require', require => {
  var Config = require('Config');
  var logger = require('logger');
  return exception => {
    var metaData = _.extend({promptedReload: true}, exception.metaData);
    logger.logException(exception, metaData);
    if (Config.env !== 'development') {
      // Prevent circular dependency
      var ReloadNotification = require('ReloadNotification');
      ReloadNotification.trigger();
    }
  };
}]);
