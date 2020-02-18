import { get } from 'lodash';

// Needs to match the value in:
// https://github.com/contentful/extensibility-api/blob/master/lib/entities/constants.ts
const APP_INSTALLATION_LIMIT = 10;

export const USAGE_EXCEEDED_MESSAGE = `You’ve reached the limit of ${APP_INSTALLATION_LIMIT} installed apps in this environment.`;

export function isUsageExceeded(installedApps) {
  return installedApps.length >= APP_INSTALLATION_LIMIT;
}

export function isUsageExceededErrorResponse(err) {
  const isForbidden = parseInt(err.status, 10) === 403;
  const reason = get(err, ['data', 'details', 'reasons']);
  const isUsageExceededReason = reason === 'Usage exceeded';

  return isForbidden && isUsageExceededReason;
}
