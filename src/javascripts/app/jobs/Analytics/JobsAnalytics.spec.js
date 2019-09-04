import * as Analytics from 'analytics/Analytics.es6';
import * as Intercom from 'services/intercom.es6';
import * as JobsAnalytics from './JobsAnalytics.es6';

jest.mock('analytics/Analytics.es6');
describe('JobsAnalytics', () => {
  beforeEach(() => {
    jest.spyOn(Analytics, 'track').mockImplementation(() => {});
    jest.spyOn(Intercom, 'trackEvent').mockImplementation(() => {});
    jest.spyOn(global, 'Date').mockImplementationOnce(() => ({
      getTimezoneOffset: () => -120
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Dialog open', () => {
    JobsAnalytics.createDialogOpen();

    expectTrackCalledOnceWith(JobsAnalytics.EventName.Dialog, {
      purpose: JobsAnalytics.JobAction.EntryPublish,
      name: JobsAnalytics.EventName.CreateJob,
      action: 'open'
    });
  });

  it('Dialog close', () => {
    JobsAnalytics.createDialogClose();

    expectTrackCalledOnceWith(JobsAnalytics.EventName.Dialog, {
      purpose: JobsAnalytics.JobAction.EntryPublish,
      name: JobsAnalytics.EventName.CreateJob,
      action: 'close'
    });
  });

  it('CreateJob', () => {
    const jobId = 'job-id';
    const scheduledAt = '2019-07-12T23:37:00.000+05:30';

    JobsAnalytics.createJob({ jobId, scheduledAt });

    expectTrackCalledOnceWith(JobsAnalytics.EventName.CreateJob, {
      action: JobsAnalytics.JobAction.EntryPublish,
      job_id: jobId,
      scheduled_for: scheduledAt,
      timezone_offset: -120
    });

    expectTrackToIntercomCalledOnceWith('scheduled-publishing-create-job');
  });

  it('cancelJob', () => {
    const jobId = 'job-id';

    JobsAnalytics.cancelJob({ jobId });

    expectTrackCalledOnceWith(JobsAnalytics.EventName.CancelJob, {
      action: JobsAnalytics.JobAction.EntryPublish,
      job_id: jobId
    });
  });

  it('trackAlphaEligibilityToIntercom', () => {
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
