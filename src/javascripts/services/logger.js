import _ from 'lodash';
import stringifySafe from 'json-stringify-safe';
import { env } from 'Config';
import * as Sentry from 'analytics/Sentry';
import { getCurrentStateName } from 'states/Navigator';

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

function augmentMetadata(metadata) {
  metadata = _.cloneDeep(metadata || {});

  const { error } = metadata;

  if (error) {
    const headers = error?.request?.headers;

    // Always mask the authorization token
    if (headers?.Authorization) {
      headers.Authorization = '[SECRET]';
    }
  }

  return _.mapValues(metadata, serializeObject);
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
  Sentry.enable(user);
}

function captureSentryException(error, level, metadata) {
  const fullMetadata = metadata;

  // Get all custom keys from the error and assign them to the metadata
  // so they don't get swallowed and therefore not logged
  for (const key of Object.keys(error)) {
    fullMetadata[key] = error[key];
  }

  const augmentedMetadata = augmentMetadata(fullMetadata);

  if (env !== 'production' && env !== 'jest') {
    /* eslint no-console: off */
    console.error(error, augmentedMetadata);
  }

  Sentry.logException(error, {
    level,
    extra: augmentedMetadata,
  });
}

/**
 * Send an error to Sentry.
 *
 * @param  {Error} error
 * @param  {Object} metadata
 * @return {void}
 */
export function captureError(error, metadata = {}) {
  captureSentryException(error, 'error', metadata);
}

/**
 * Send a warning to Sentry.
 * @param  {Error} error
 * @param  {Object} metadata
 * @return {void}
 */
export function captureWarning(error, metadata = {}) {
  captureSentryException(error, 'warning', metadata);
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
 * @param {object?} metaData       Can take any of the expected bugsnag metadata properties.
 * @param {object?} metaData.data  Shows up on the bugsnag data tab.
 * @param {object?} metaData.error Shows up on the bugsnag error tab. Either the API error
 *                                itself or a server response object with `body` or `data`
 *                                field holding the actual API error.
 * @param {string} metaData.groupingHash Allows to group as same bugsnag issue despite different `message`.
 */
export function logServerError(message, metaData) {
  if (_.get(metaData, 'error.statusCode') === 0) {
    _logCorsWarn(message, metaData);
  } else {
    _log('Logged Server Error', 'error', message, augmentMetadata(metaData));
  }
}

/**
 * Logs an error from the Contentful API with warn level
 *
 * The Bugsnag title of the error will be “Logged Server Warning”.
 *
 * @param {string} message
 * @param {object?} metaData       Can take any of the expected bugsnag metadata properties.
 * @param {object?} metaData.data  Shows up on the bugsnag data tab.
 * @param {object?} metaData.error Shows up on the bugsnag error tab. Either the API error
 *                                itself or a server response object with `body` or `data`
 *                                field holding the actual API error.
 * @param {string?} metaData.groupingHash Allows to group as same bugsnag issue despite different `message`.
 */
export function logServerWarn(message, metaData) {
  if (_.get(metaData, 'error.statusCode') === 0) {
    _logCorsWarn(message, metaData);
  } else {
    _log('Logged Server Warning', 'warning', message, augmentMetadata(metaData));
  }
}

/**
 * Log an error specific to ShareJS with error level
 * @param {string} message
 * @param {object?} metaData       Can take any of the expected bugsnag metadata properties.
 * @param {object?} metaData.data  Shows up on the bugsnag data tab.
 * @param {object?} metaData.error Shows up on the bugsnag error tab.
 * @param {string?} metaData.groupingHash Allows to group as same bugsnag issue despite different `message`.
 */
export function logSharejsError(message, metaData) {
  _log('Logged ShareJS Error', 'error', message, metaData);
}

/**
 * Log an error specific to ShareJS with warn level
 * @param {string} message
 * @param {object?} metaData       Can take any of the expected bugsnag metadata properties.
 * @param {object?} metaData.data  Shows up on the bugsnag data tab.
 * @param {object?} metaData.error Shows up on the bugsnag error tab.
 * @param {string?} metaData.groupingHash Allows to group as same bugsnag issue despite different `message`.
 */
export function logSharejsWarn(message, metaData) {
  _log('Logged ShareJS Warning', 'warning', message, metaData);
}

/**
 * Log detected CORS warnings
 * @param {string} message
 * @param {object?} metaData       Can take any of the expected bugsnag metadata properties.
 * @param {object?} metaData.data  Shows up on the bugsnag data tab.
 * @param {object?} metaData.error Shows up on the bugsnag error tab.
 * @param {string?} metaData.groupingHash Allows to group as same bugsnag issue despite different `message`.
 */
function _logCorsWarn(message, metaData) {
  _log('CORS Warning', 'warning', message, metaData);
}

/**
 * Log a message to Sentry.
 * @param {String} type
 * @param {String} severity
 * @param {String} message
 * @param {Object?} metadata Additional info to show in Sentry. Each key creates a tab that
 * displays the corresponding value.
 */
function _log(type, severity, message, metadata) {
  metadata = metadata || {};
  metadata.groupingHash = metadata.groupingHash || message;

  const augmentedMetadata = augmentMetadata(metadata);
  if (env !== 'production' && env !== 'jest') {
    logToConsole(type, severity, message, augmentedMetadata);
  }

  if (message instanceof Error) {
    message = message.message;
  }

  // Items without a message are essentially noise (it's really hard to act on them)
  // and therefore useless, so we ignore those
  //
  // This happens here rather than at the top so that errors are still logged locally
  if (!message) {
    return;
  }

  // We don't care about the groupingHash, Sentry is smart enough in its filtering
  const { groupingHash: _, ...otherMetadata } = metadata;

  Sentry.logMessage(message, {
    level: severity,
    tags: {
      route: getCurrentStateName(),
    },
    extra: {
      ...otherMetadata,
      type,
    },
  });
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
