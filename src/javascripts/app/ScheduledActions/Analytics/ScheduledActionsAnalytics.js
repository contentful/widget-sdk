import { once } from 'lodash';
import moment from 'moment-timezone';
import * as Analytics from 'analytics/Analytics';
import * as Intercom from 'services/intercom';
import ScheduledActionAction from '../ScheduledActionAction';

const AnalyticsEventName = {
  Dialog: 'global:dialog',
  CancelJob: 'jobs:cancel',
  CreateJob: 'jobs:create',
};

const IntercomEventName = {
  AlphaEligible: 'scheduled-publishing-alpha-eligible',
  CreateJob: 'scheduled-publishing-create-job',
};

const AnalyticsAction = {
  EntryPublish: 'Entry.publish',
  EntryUnpublish: 'Entry.unpublish',
};

/** Will become obsolete once we change action format in the api */
function convertActionToAnalyticsFormat(jobAction) {
  switch (jobAction) {
    case ScheduledActionAction.Publish:
      return AnalyticsAction.EntryPublish;
    case ScheduledActionAction.Unpublish:
      return AnalyticsAction.EntryUnpublish;
    default:
      throw new Error(`unsupported job action ${jobAction}`);
  }
}

export function createDialogOpen() {
  const payload = {
    purpose: 'job.create',
    name: AnalyticsEventName.CreateJob,
    action: 'open',
  };

  return Analytics.track(AnalyticsEventName.Dialog, payload);
}

export function createDialogClose() {
  const payload = {
    name: AnalyticsEventName.CreateJob,
    action: 'close',
  };

  return Analytics.track(AnalyticsEventName.Dialog, payload);
}

export function createJob(job, scheduledForTimezone) {
  const payload = {
    action: convertActionToAnalyticsFormat(job.action),
    job_id: job.sys.id,
    scheduled_for: job.scheduledFor.datetime,
    entity_id: job.entity.sys.id,
    scheduled_for_timezone: scheduledForTimezone,
    local_timezone: moment.tz.guess(),
    timezone_offset: new Date().getTimezoneOffset(),
  };

  Intercom.trackEvent(IntercomEventName.CreateJob);
  return Analytics.track(AnalyticsEventName.CreateJob, payload);
}

export function cancelJob(job) {
  const payload = {
    action: convertActionToAnalyticsFormat(job.action),
    job_id: job.sys.id,
  };
  return Analytics.track(AnalyticsEventName.CancelJob, payload);
}

export const trackAlphaEligibilityToIntercom = once(() => {
  Intercom.trackEvent(IntercomEventName.AlphaEligible);
});
