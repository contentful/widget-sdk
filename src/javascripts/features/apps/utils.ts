import { get } from 'lodash';
import { BASIC_APPS_LIMIT, ADVANCED_APPS_LIMIT } from './limits';
import { WidgetLocation } from '@contentful/widget-renderer';

export const getUsageExceededMessage = (hasAdvancedAppsFeature = false) => {
  const spaceInstallationLimit = hasAdvancedAppsFeature ? ADVANCED_APPS_LIMIT : BASIC_APPS_LIMIT;
  return `You’ve reached the limit of ${spaceInstallationLimit} installed apps in this environment. To fix this, uninstall an app or contact support.`;
};

export function isUsageExceeded(installedApps, hasAdvancedAppsFeature = false) {
  const spaceInstallationLimit = hasAdvancedAppsFeature ? ADVANCED_APPS_LIMIT : BASIC_APPS_LIMIT;
  return installedApps.length >= spaceInstallationLimit;
}

export function isUsageExceededErrorResponse(err) {
  const isForbidden = parseInt(err.status, 10) === 403;
  const reason = get(err, ['data', 'details', 'reasons']);
  const isUsageExceededReason = reason === 'Usage exceeded.';

  return isForbidden && isUsageExceededReason;
}

export function hasConfigLocation(appDefinition) {
  if (!appDefinition) return false;

  const locations = appDefinition.locations || [];
  return locations.some(
    (l: { location: WidgetLocation }) => l.location === WidgetLocation.APP_CONFIG
  );
}
