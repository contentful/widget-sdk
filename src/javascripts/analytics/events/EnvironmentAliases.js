import { track as analyticsTrack } from 'analytics/Analytics';
import * as Intercom from 'services/intercom';

const PREFIX = 'environment_aliases:';
const track = (e, data) => analyticsTrack(`${PREFIX}${e}`, data);

export function optInStart(data) {
  track('opt_in_start', data);
}

export function optInComplete(data) {
  track('opt_in_complete', data);
  return Intercom.trackEvent('environment_aliases-optin');
}

export function optInStep(step, data) {
  track(`opt_in_step_${step}`, data);
}

export function optInAbortStep(step, data) {
  track(`opt_in_abort_step_${step}`, data);
}

export function changeEnvironmentOpen(data) {
  track('change_environment_open', data);
}

export function changeEnvironmentAbort(data) {
  track('change_environment_abort', data);
}

export function changeEnvironmentConfirm(data) {
  return Intercom.trackEvent('environment_aliases-change', data);
}

export function notificationEnvironmentAliasChanged(data) {
  track('notification_environment_alias_changed', data);
}

export function notificationSwitchToAlias(data) {
  track('notification_switch_to_alias', data);
}

export function notificationContinueOnEnvironment(data) {
  track('notification_continue_on_environment', data);
}