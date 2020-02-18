// Needs to match the value in:
// https://github.com/contentful/extensibility-api/blob/master/lib/entities/constants.ts
const APP_INSTALLATION_LIMIT = 10;

export function isUsageExceeded(installedApps) {
  return installedApps.length >= APP_INSTALLATION_LIMIT;
}
