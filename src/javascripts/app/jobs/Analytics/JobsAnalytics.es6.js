import { once } from 'lodash';
import * as Analytics from 'analytics/Analytics.es6';
import * as Intercom from 'services/intercom.es6';
import JobAction from '../JobAction.es6';

const AnalyticsEventName = {
  Dialog: 'global:dialog',
  CancelJob: 'jobs:cancel',
  CreateJob: 'jobs:create'
};

const IntercomEventName = {
  AlphaEligible: 'scheduled-publishing-alpha-eligible',
  CreateJob: 'scheduled-publishing-create-job'
};

const AnalyticsJobAction = {
  EntryPublish: 'Entry.publish',
  EntryUnpublish: 'Entry.unpublish'
};

/** Will become obsolete once we change action format in the api */
function convertActionToAnalyticsFormat(jobAction) {
  switch (jobAction) {
    case JobAction.Publish:
      return AnalyticsJobAction.EntryPublish;
    case JobAction.Unpublish:
      return AnalyticsJobAction.EntryUnpublish;
    default:
      throw new Error(`unsupported job action ${jobAction}`);
  }
}

export function createDialogOpen() {
  const payload = {
    purpose: 'job.create',
    name: AnalyticsEventName.CreateJob,
    action: 'open'
  };

  return Analytics.track(AnalyticsEventName.Dialog, payload);
}

export function createDialogClose() {
  const payload = {
    name: AnalyticsEventName.CreateJob,
    action: 'close'
  };

  return Analytics.track(AnalyticsEventName.Dialog, payload);
}

export function createJob(job) {
  const payload = {
    action: convertActionToAnalyticsFormat(job.action),
    job_id: job.sys.id,
    scheduled_for: job.scheduledAt,
    entity_id: job.sys.entity.sys.id,
    timezone_offset: new Date().getTimezoneOffset()
  };

  Intercom.trackEvent(IntercomEventName.CreateJob);
  return Analytics.track(AnalyticsEventName.CreateJob, payload);
}

export function cancelJob(job) {
  const payload = {
    action: convertActionToAnalyticsFormat(job.action),
    job_id: job.sys.id
  };
  return Analytics.track(AnalyticsEventName.CancelJob, payload);
}

export const trackAlphaEligibilityToIntercom = once(() => {
  Intercom.trackEvent(IntercomEventName.AlphaEligible);
});
