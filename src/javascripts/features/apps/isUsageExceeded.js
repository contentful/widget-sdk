import { get } from 'lodash';

// Needs to match the value in:
// https://github.com/contentful/extensibility-api/blob/master/lib/entities/constants.ts
export const APP_INSTALLATION_LIMIT = 10;
export const ADVANCED_APPS_INSTALLATION_LIMIT = 50;

export const getUsageExceededMessage = (hasAdvancedAppsFeature = false) => {
  const spaceInstallationLimit = hasAdvancedAppsFeature
    ? ADVANCED_APPS_INSTALLATION_LIMIT
    : APP_INSTALLATION_LIMIT;
  return `You’ve reached the limit of ${spaceInstallationLimit} installed apps in this environment. To fix this, uninstall an app or contact support.`;
};

export function isUsageExceeded(installedApps, hasAdvancedAppsFeature = false) {
  const spaceInstallationLimit = hasAdvancedAppsFeature
    ? ADVANCED_APPS_INSTALLATION_LIMIT
    : APP_INSTALLATION_LIMIT;
  return installedApps.length >= spaceInstallationLimit;
}

export function isUsageExceededErrorResponse(err) {
  const isForbidden = parseInt(err.status, 10) === 403;
  const reason = get(err, ['data', 'details', 'reasons']);
  const isUsageExceededReason = reason === 'Usage exceeded.';

  return isForbidden && isUsageExceededReason;
}
