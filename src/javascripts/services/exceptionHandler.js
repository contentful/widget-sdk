import { registerFactory } from 'core/NgRegistry';
import _ from 'lodash';
import ReloadNotification from 'app/common/ReloadNotification';
import * as logger from 'services/logger';

export default function register() {
  /**
   * This service defines the function that handles uncaught exceptions
   * in Angular’s digest loop.
   *
   * We call logger.logExceptions which logs the exception to the console
   * and to bugsnag if it is enabled.
   */
  registerFactory('$exceptionHandler', [
    function exceptionHandler() {
      return (exception) => {
        const metaData = _.extend({ promptedReload: true }, exception.metaData);

        logger.logException(exception, metaData);
        ReloadNotification.trigger();
      };
    },
  ]);
}
