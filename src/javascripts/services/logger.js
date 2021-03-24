import _ from 'lodash';
import stringifySafe from 'json-stringify-safe';
import { env } from 'Config';
import * as Sentry from 'analytics/Sentry';
import { getCurrentStateName } from 'states/Navigator';

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
    logToConsole(error, level, augmentedMetadata);
  }

  Sentry.logException(error, {
    level,
    extra: augmentedMetadata,
    tags: {
      route: getCurrentStateName(),
    },
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

function logToConsole(error, level, metadata) {
  /* eslint no-console: off */
  switch (level) {
    case 'error':
      console.error(error, metadata);
      break;
    case 'warning':
      console.warn(error, metadata);
      break;
    default:
      console.log(error, metadata);
  }
}
