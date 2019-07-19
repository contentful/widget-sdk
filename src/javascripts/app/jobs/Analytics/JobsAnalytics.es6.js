import * as Analytics from 'analytics/Analytics.es6';

/**
 * Exported for testing purposes. Do not use in production !!!
 */
export const EventName = {
  Dialog: 'global:dialog',
  CancelJob: 'jobs:cancel',
  CreateJob: 'jobs:create'
};

/**
 * Atm, supported only 'Entry.publish'
 * Exported for testing purposes. Do not use in production !!!
 */
export const JobAction = {
  EntryPublish: 'Entry.publish'
};

export function createDialogOpen() {
  const payload = {
    purpose: JobAction.EntryPublish,
    name: EventName.CreateJob,
    action: 'open'
  };

  return Analytics.track(EventName.Dialog, payload);
}

export function createDialogClose() {
  const payload = {
    purpose: JobAction.EntryPublish,
    name: EventName.CreateJob,
    action: 'close'
  };

  return Analytics.track(EventName.Dialog, payload);
}

export function createJob({ jobId, scheduledFor }) {
  const payload = {
    action: JobAction.EntryPublish,
    job_id: jobId,
    scheduled_for: scheduledFor,
    timezone_offset: new Date().getTimezoneOffset()
  };

  return Analytics.track(EventName.CreateJob, payload);
}

export function cancelJob({ jobId }) {
  const payload = {
    action: JobAction.EntryPublish,
    job_id: jobId
  };
  return Analytics.track(EventName.CancelJob, payload);
}
