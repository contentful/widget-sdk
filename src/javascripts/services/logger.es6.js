import _ from 'lodash';
import stringifySafe from 'json-stringify-safe';
import { env } from 'Config.es6';
import * as Bugsnag from 'analytics/Bugsnag.es6';

/**
 * Log errors and exceptions to Bugsnag or the console.
 *
 * ~~~js
 * // error type: 'Logged Error',
 * // severity: 'error'
 * // and additional info
 * logger.logError('something happened', {
 *   error: { ... },
 *   data: { ... }
 * })
 * ~~~
 *
 * ## Logging methods
 *
 * Each logging method defines the error type and severity and accepts
 * additional parameters.
 *
 * The `message` argument identifies the error and will by default
 * be used as `metaData.groupingHash` which allows Bugsnag to group
 * different logged events. It should be a short, descriptive and
 * constant string, that is an invocation of a logging call should
 * not interpolate the message.
 *
 * The `metaData` is an object where each key corresponds to a [tab in
 * Bugsnag][bugsnag-tab] in Bugsnag that displays the corresponding
 * value. The value may be an arbitrary JavaScript object. Note that
 * values are truncated to a maximal depth of three before sending
 * them.
 *
 * See the [Bugsnag documentation][bugsnag-doc] for more details.
 *
 * [bugsnag-tab]: https://bugsnag.com/docs/notifiers/js#metadata
 * [bugsnag-doc]: https://bugsnag.com/docs/notifiers/js
 *
 * ## Unhandled exceptions
 *
 * Unhandled exceptions inside Angular’s digest loop are handled by the
 * `$exceptionHandler` service. This service delegates to
 * `logger.logException` and shows a dialog informing the user that the
 * app has crashed.
 *
 * Other uncaught exceptions and unhandled promise rejections are
 * logged to the console and to Bugsnag if bugsnag is enabled.
 */

function augmentMetadata(metaData) {
  metaData = metaData || {};
  metaData.params = {};
  return _.mapValues(metaData, serializeObject);
}

/**
 * Given an aribtrary JS object returns a JSON object without `$$`
 * properties and circular references.
 */
function serializeObject(obj) {
  return JSON.parse(stringifySafe(obj) || '{}', filterInternalProperties);
}

function filterInternalProperties(key, value) {
  if (key.substr(0, 2) === '$$') {
    return;
  } else {
    return value;
  }
}

/**
 * Bugsnag doesn't serialize objects past a certain level and it's better to
 * flatten these errors than running a fork of their JS reporter that serializes
 * objects deeper.
 */
function flattenServerErrors(metaData) {
  // Don't ever affect outside references as they travel through the whole app!
  metaData = _.cloneDeep(metaData || {});
  const errOrResponse = metaData.error;

  if (errOrResponse) {
    const err = findActualServerError(errOrResponse);

    // Never send auth token.
    const headers = _.get(errOrResponse, 'request.headers');
    if (headers && headers.Authorization) {
      headers.Authorization = '[SECRET]';
    }

    // “ERROR DETAILS” tab
    if (err && err.details) {
      metaData.errorDetails = err.details;
      // Indicate this info can be found in another tab.
      err.details = '[@ERROR_DETAILS tab]';
    }

    if (err !== errOrResponse) {
      // SERVER RESPONSE tab (with `body` or `data` containing actual error)
      // Also contains additional info (e.g. `request` and `statusCode`)
      metaData.serverResponse = errOrResponse;
      delete metaData.error;
      // TODO: Also have ERROR tab and replace `body` or `data` with [@ERROR tab]
    }
  }
  return metaData;
}

/**
 * Takes an Object which is expected to be or to contain a server (CMA) error
 * and returns the error. Null if no error is found.
 *
 * TODO: Find a better place for this or even better - make it obsolete.
 */
export function findActualServerError(errOrErrContainer) {
  errOrErrContainer = errOrErrContainer || {};
  const actualErr = errOrErrContainer.body || errOrErrContainer.data || errOrErrContainer;
  return _.get(actualErr, 'sys.type') === 'Error' ? actualErr : undefined;
}

/**
 * Load bugsnag and set the user data.
 */
export function enable(user) {
  Bugsnag.enable(user);
}

/**
 * Disables the logger service because of customers who wish to not have
 * any 3rd party services running
 */
export function disable() {
  if (env === 'production' || env === 'unittest') {
    Bugsnag.disable();
  }
}

/**
 * Mostly used by the $uncaughtException service
 * @param {Error} exception  Exception Error object
 * @param {Object} metaData  Metadata object. Can take any of the expected bugsnag metadata parameters.
 * @param {Object} metaData.data  Additional data (other objects). Shows up on the bugsnag data tab.
 */
export function logException(exception, metaData) {
  const augmentedMetadata = augmentMetadata(metaData);
  if (env !== 'production' && env !== 'unittest') {
    /* eslint no-console: off */
    console.error(exception, augmentedMetadata);
  }
  Bugsnag.notifyException(exception, null, augmentedMetadata, 'error');
}

/**
 * Log with error level
 * @param {string} message
 * @param {object} metaData       Can take any of the expected bugsnag metadata properties.
 * @param {object} metaData.data  Shows up on the bugsnag data tab.
 * @param {object} metaData.error Shows up on the bugsnag error tab.
 */
export function logError(message, metaData) {
  _log('Logged Error', 'error', message, metaData);
}

/**
 * Log a warning to Bugsnag with the 'Logged Warning' title and the
 * given message.
 *
 * @param {string} message
 * @param {object} metaData       Can take any of the expected bugsnag metadata properties.
 * @param {object} metaData.data  Shows up on the bugsnag data tab.
 * @param {object} metaData.error Shows up on the bugsnag error tab.
 */
export function logWarn(message, metaData) {
  _log('Logged Warning', 'warning', message, metaData);
}

/**
 * Logs an error from the Contentful API to Bugsnag.
 *
 * The Bugsnag title of the error will be “Logged Server Error”.
 *
 * ~~~js
 * cfServerAPICall()
 * .then(handleSuccess)
 * .catch(function(error) {
 *   logger.logServerError('a server error', {error: error})
 * })
 * ~~~
 *
 * @param {string} message
 * @param {object} metaData       Can take any of the expected bugsnag metadata properties.
 * @param {object} metaData.data  Shows up on the bugsnag data tab.
 * @param {object} metaData.error Shows up on the bugsnag error tab. Either the API error
 *                                itself or a server response object with `body` or `data`
 *                                field holding the actual API error.
 */
export function logServerError(message, metaData) {
  if (_.get(metaData, 'error.statusCode') === 0) {
    _logCorsWarn(message, metaData);
  } else {
    _log('Logged Server Error', 'error', message, flattenServerErrors(metaData));
  }
}

/**
 * Logs an error from the Contentful API with warn level
 *
 * The Bugsnag title of the error will be “Logged Server Warning”.
 *
 * @param {string} message
 * @param {object} metaData       Can take any of the expected bugsnag metadata properties.
 * @param {object} metaData.data  Shows up on the bugsnag data tab.
 * @param {object} metaData.error Shows up on the bugsnag error tab. Either the API error
 *                                itself or a server response object with `body` or `data`
 *                                field holding the actual API error.
 */
export function logServerWarn(message, metaData) {
  if (_.get(metaData, 'error.statusCode') === 0) {
    _logCorsWarn(message, metaData);
  } else {
    _log('Logged Server Warning', 'warning', message, flattenServerErrors(metaData));
  }
}

/**
 * Log an error specific to ShareJS with error level
 * @param {string} message
 * @param {object} metaData       Can take any of the expected bugsnag metadata properties.
 * @param {object} metaData.data  Shows up on the bugsnag data tab.
 * @param {object} metaData.error Shows up on the bugsnag error tab.
 */
export function logSharejsError(message, metaData) {
  _log('Logged ShareJS Error', 'error', message, metaData);
}

/**
 * Log an error specific to ShareJS with warn level
 * @param {string} message
 * @param {object} metaData       Can take any of the expected bugsnag metadata properties.
 * @param {object} metaData.data  Shows up on the bugsnag data tab.
 * @param {object} metaData.error Shows up on the bugsnag error tab.
 */
export function logSharejsWarn(message, metaData) {
  _log('Logged ShareJS Warning', 'warning', message, metaData);
}

/**
 * Log detected CORS warnings
 * @param {string} message
 * @param {object} metaData       Can take any of the expected bugsnag metadata properties.
 * @param {object} metaData.data  Shows up on the bugsnag data tab.
 * @param {object} metaData.error Shows up on the bugsnag error tab.
 */
function _logCorsWarn(message, metaData) {
  _log('CORS Warning', 'warning', message, metaData);
}

/**
 * Log a message to the bugsnag wrapper.
 * @param {String} type
 * @param {String} severity
 * @param {String} message
 * @param {Object} metadata
 * Additional info to show in bugsnag. Each key creates a tab that
 * displays the corresponding value.
 */
function _log(type, severity, message, metadata) {
  metadata = metadata || {};
  metadata.groupingHash = metadata.groupingHash || message;
  const augmentedMetadata = augmentMetadata(metadata);
  if (env !== 'production' && env !== 'unittest') {
    logToConsole(type, severity, message, augmentedMetadata);
  }
  Bugsnag.notify(type, message, augmentedMetadata, severity);
}

/**
 * Records an event.
 *
 * The event trail is shown on bugsnag when an error occured.
 *
 * Note that the data object should only be one level deep and the
 * object’s values are limited to 140 characters each.
 *
 * https://docs.bugsnag.com/platforms/browsers/#leaving-breadcrumbs
 *
 * @param {string} name
 * @param {object} data
 */
export function leaveBreadcrumb(name, data) {
  Bugsnag.leaveBreadcrumb(name, data);
}

function logToConsole(type, severity, message, metadata) {
  message = type + ': ' + message;
  /* eslint no-console: off */
  switch (severity) {
    case 'error':
      console.error(message, metadata);
      break;
    case 'warning':
      console.warn(message, metadata);
      break;
    default:
      console.log(message, metadata);
  }
}
