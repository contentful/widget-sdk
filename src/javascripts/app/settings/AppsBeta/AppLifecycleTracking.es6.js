import * as Random from 'utils/Random.es6';
import * as Analytics from 'analytics/Analytics.es6';

// Id for correlating actions pereformed
// in the same user session.
const userSessionId = Random.id();

export function detailsOpened(appId) {
  track('details-opened', appId);
}

export function permissionsOpened(appId) {
  track('permissions-opened', appId);
}

export function permissionsAccepted(appId) {
  track('permissions-accepted', appId);
}

export function permissionsDismissed(appId) {
  track('permissions-dismissed', appId);
}

export function configurationOpened(appId) {
  track('configuration-opened', appId);
}

export function configurationUpdated(appId) {
  track('configuration-updated', appId);
}

export function installed(appId) {
  track('installed', appId);
}

export function configurationUpdateFailed(appId) {
  track('configuration-update-failed', appId);
}

export function installationFailed(appId) {
  track('installation-failed', appId);
}

export function uninstallationInitiated(appId) {
  track('uninstallation-initiated', appId);
}

export function uninstallationCancelled(appId) {
  track('uninstallation-cancelled', appId);
}

export function uninstalled(appId, reasons) {
  const eventId = track('uninstalled', appId);
  trackUninstallationReasons(eventId, appId, reasons);
}

export function uninstallationFailed(appId) {
  track('uninstallation-failed', appId);
}

function track(eventName, appId) {
  const uniqueEventId = Random.id();

  Analytics.track('apps:lifecycle_event', {
    uniqueEventId,
    userSessionId,
    appId,
    eventName
  });

  return uniqueEventId;
}

function trackUninstallationReasons(eventId, appId, reasons) {
  (reasons || []).forEach(reason => {
    Analytics.track('apps:uninstallation_reason', {
      eventId,
      userSessionId,
      appId,
      reason
    });
  });
}
