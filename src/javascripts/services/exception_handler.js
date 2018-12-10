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
    const logger = require('logger');
    const _ = require('lodash');
    return exception => {
      const metaData = _.extend({ promptedReload: true }, exception.metaData);
      const ReloadNotification = require('ReloadNotification');

      logger.logException(exception, metaData);
      ReloadNotification.trigger();
    };
  }
]);
