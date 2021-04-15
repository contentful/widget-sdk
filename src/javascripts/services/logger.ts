import { env } from 'Config';
import * as Sentry from 'analytics/Sentry';
import { getCurrentStateName } from 'states/Navigator';
import { User } from 'core/services/SpaceEnvContext/types';
import { Severity } from '@sentry/types';
import { PreflightRequestError } from 'data/Request';

// For details about error tracking and best practices, please see the error tracking doc at
// /docs/guides/error-tracking.md.

interface Metadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Load Sentry and set the user data.
 */
export function enable(user: User) {
  Sentry.enable(user);
}

function captureSentryException(error: Error, level: Severity, metadata: Metadata) {
  // We don't care about preflight request errors
  if (error instanceof PreflightRequestError) {
    return;
  }

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
 */
export function captureError(error: Error, metadata: Metadata = {}) {
  captureSentryException(error, Severity.Error, metadata);
}

/**
 * Send a warning to Sentry.
 */
export function captureWarning(error: Error, metadata: Metadata = {}) {
  captureSentryException(error, Severity.Warning, metadata);
}

function logToConsole(error: Error, level: Severity, metadata: Metadata) {
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
