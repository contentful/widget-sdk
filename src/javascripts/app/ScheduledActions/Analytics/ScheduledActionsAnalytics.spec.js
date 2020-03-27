import * as Analytics from 'analytics/Analytics';
import * as Intercom from 'services/intercom';
import * as JobsAnalytics from './ScheduledActionsAnalytics';
import ScheduledActionAction from '../ScheduledActionAction';

jest.mock('analytics/Analytics');
jest.mock('moment-timezone');
describe('JobsAnalytics', () => {
  beforeEach(() => {
    jest.spyOn(Analytics, 'track').mockImplementation(() => {});
    jest.spyOn(Intercom, 'trackEvent').mockImplementation(() => {});
    jest.spyOn(global, 'Date').mockImplementationOnce(() => ({
      getTimezoneOffset: () => -120,
    }));
  });

  it('Dialog open', () => {
    JobsAnalytics.createDialogOpen();

    expectTrackCalledOnceWith('global:dialog', {
      name: 'jobs:create',
      purpose: 'job.create',
      action: 'open',
    });
  });

  it('Dialog close', () => {
    JobsAnalytics.createDialogClose();

    expectTrackCalledOnceWith('global:dialog', {
      name: 'jobs:create',
      action: 'close',
    });
  });

  it.each([
    [ScheduledActionAction.Publish, 'Entry.publish'],
    [ScheduledActionAction.Unpublish, 'Entry.unpublish'],
  ])('CreateJob with action %i', (jobAction, eventAction) => {
    const jobId = 'job-id';
    const entityId = 'entity-id';
    const scheduledFor = {
      datetime: '2019-07-12T23:37:00.000+05:30',
    };

    const job = {
      entity: {
        sys: {
          id: entityId,
        },
      },
      sys: {
        id: jobId,
      },
      action: jobAction,
      scheduledFor,
    };

    JobsAnalytics.createJob(job);

    expectTrackCalledOnceWith('jobs:create', {
      action: eventAction,
      job_id: jobId,
      entity_id: entityId,
      scheduled_for: scheduledFor.datetime,
      timezone_offset: -120,
    });

    expectTrackToIntercomCalledOnceWith('scheduled-publishing-create-job');
  });

  it.each([
    [ScheduledActionAction.Publish, 'Entry.publish'],
    [ScheduledActionAction.Unpublish, 'Entry.unpublish'],
  ])('cancelJob with action %i', (jobAction, eventAction) => {
    const jobId = 'job-id';

    const job = {
      sys: {
        id: jobId,
      },
      action: jobAction,
    };

    JobsAnalytics.cancelJob(job);

    expectTrackCalledOnceWith('jobs:cancel', {
      action: eventAction,
      job_id: jobId,
    });
  });

  it('trackAlphaEligibilityToIntercom calls Intercom once', () => {
    JobsAnalytics.trackAlphaEligibilityToIntercom();
    JobsAnalytics.trackAlphaEligibilityToIntercom();
    JobsAnalytics.trackAlphaEligibilityToIntercom();

    expectTrackToIntercomCalledOnceWith('scheduled-publishing-alpha-eligible');
  });
});

function expectTrackCalledOnceWith(eventName, payload) {
  expect(Analytics.track).toHaveBeenCalledTimes(1);
  expect(Analytics.track).toHaveBeenCalledWith(eventName, payload);
}

function expectTrackToIntercomCalledOnceWith(eventName) {
  expect(Intercom.trackEvent).toHaveBeenCalledTimes(1);
  expect(Intercom.trackEvent).toHaveBeenCalledWith(eventName);
}
