import { get } from 'lodash';
import * as Random from 'utils/Random.es6';
import * as Analytics from 'analytics/Analytics';
import * as Intercom from 'services/intercom.es6';

const INTERCOM_PREFIX = 'feature-apps-beta';

export function detailsOpened(appId) {
  track('details-opened', appId);
  trackInIntercom('app-details-opened', { appId });
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
  trackInIntercom('app-installed', { appId });
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

function trackInIntercom(eventName, details) {
  Intercom.trackEvent(`${INTERCOM_PREFIX}-${eventName}`, details);
}

function track(eventName, appId) {
  // FE-generated unique ID of the event.
  // We return it from this function so it can be used
  // in consecutive `track()` calls.
  const eventId = Random.id();

  Analytics.track('apps:lifecycle_event', {
    eventId,
    appId,
    eventName
  });

  return eventId;
}

function trackUninstallationReasons(eventId, appId, reasons) {
  (reasons || []).forEach(reason => {
    const custom = typeof reason !== 'string';

    Analytics.track('apps:uninstallation_reason', {
      eventId,
      appId,
      custom,
      reason: custom ? get(reason, ['custom'], 'unknown') : reason
    });
  });
}
