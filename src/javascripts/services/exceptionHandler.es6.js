import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import ReloadNotification from 'app/common/ReloadNotification.es6';

/**
 * This service defines the function that handles uncaught exceptions
 * in Angular’s digest loop.
 *
 * We call logger.logExceptions which logs the exception to the console
 * and to bugsnag if it is enabled.
 */
registerFactory('$exceptionHandler', [
  'logger',
  logger => {
    return exception => {
      const metaData = _.extend({ promptedReload: true }, exception.metaData);

      logger.logException(exception, metaData);
      ReloadNotification.trigger();
    };
  }
]);
