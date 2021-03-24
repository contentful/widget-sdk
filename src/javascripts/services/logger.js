import _ from 'lodash';
import { env } from 'Config';
import * as Sentry from 'analytics/Sentry';
import { getCurrentStateName } from 'states/Navigator';

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

  if (env !== 'production' && env !== 'jest') {
    logToConsole(error, level, fullMetadata);
  }

  Sentry.logException(error, {
    level,
    extra: fullMetadata,
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
