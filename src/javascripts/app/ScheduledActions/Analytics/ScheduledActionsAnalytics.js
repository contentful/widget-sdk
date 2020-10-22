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
  Publish: (entityType) => `${entityType}.publish`,
  Unpublish: (entityType) => `${entityType}.unpublish`,
};

/** Will become obsolete once we change action format in the api */
function formatAnalyticsAction(scheduledAction) {
  const { action, entity } = scheduledAction || {};

  const entityType = entity?.sys.linkType;

  switch (action) {
    case ScheduledActionAction.Publish:
      return AnalyticsAction.Publish(entityType);
    case ScheduledActionAction.Unpublish:
      return AnalyticsAction.Unpublish(entityType);
    default:
      throw new Error(`unsupported job action ${action}`);
  }
}

export function createDialogOpen() {
  const payload = {
    purpose: 'create',
    name: AnalyticsEventName.CreateJob,
    action: 'open',
  };

  return Analytics.track(AnalyticsEventName.Dialog, payload);
}

/**
 * Tracks closing of the scheduled actions modal
 * @param {*} wasSubmitted indicates if the modal was closed after submitted scheduled action or just a plain Cancel / Close
 */
export function createDialogClose(wasSubmitted) {
  const payload = {
    name: AnalyticsEventName.CreateJob,
    purpose: wasSubmitted ? 'submit' : 'cancel',
    action: 'close',
  };

  return Analytics.track(AnalyticsEventName.Dialog, payload);
}

export function createJob(job, scheduledForTimezone) {
  const payload = {
    action: formatAnalyticsAction(job),
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
    action: formatAnalyticsAction(job),
    job_id: job.sys.id,
  };
  return Analytics.track(AnalyticsEventName.CancelJob, payload);
}

export const trackAlphaEligibilityToIntercom = once(() => {
  Intercom.trackEvent(IntercomEventName.AlphaEligible);
});
