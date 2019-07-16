import * as Analytics from 'analytics/Analytics.es6';

/**
 * Exported for testing purposes. Do not use in production !!!
 */
export const EventName = {
  CreateDialogOpen: 'jobs_create_dialog_open',
  CreateDialogClose: 'jobs_create_dialog_close',
  CreateDialogSubmit: 'jobs_create_dialog_submit',
  CancelJob: 'jobs_cancel'
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
    action: JobAction.EntryPublish
  };

  return Analytics.track(EventName.CreateDialogOpen, payload);
}

export function createDialogClose() {
  const payload = {
    action: JobAction.EntryPublish
  };

  return Analytics.track(EventName.CreateDialogClose, payload);
}

export function createDialogSubmit({ jobId, scheduledFor }) {
  const payload = {
    action: JobAction.EntryPublish,
    job_id: jobId,
    scheduled_for: scheduledFor,
    timezone_offset: new Date().getTimezoneOffset()
  };

  return Analytics.track(EventName.CreateDialogSubmit, payload);
}

export function cancelJob({ jobId }) {
  const payload = {
    action: JobAction.EntryPublish,
    job_id: jobId
  };
  return Analytics.track(EventName.CancelJob, payload);
}
