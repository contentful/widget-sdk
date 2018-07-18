'use strict';

/**
 * This service defines the function that handles uncaught exceptions
 * in Angular’s digest loop.
 *
 * We call logger.logExceptions which logs the exception to the console
 * and to bugsnag if it is enabled.
 */
angular.module('contentful').factory('$exceptionHandler', [
  'require',
  require => {
    var logger = require('logger');
    return exception => {
      var metaData = _.extend({promptedReload: true}, exception.metaData);
      var ReloadNotification = require('ReloadNotification');

      logger.logException(exception, metaData);
      ReloadNotification.trigger();
    };
  }
]);
