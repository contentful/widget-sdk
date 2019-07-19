import * as Analytics from 'analytics/Analytics.es6';
import * as JobsAnalytics from './JobsAnalytics.es6';

jest.mock('analytics/Analytics.es6');
describe('JobsAnalytics', () => {
  beforeEach(() => {
    jest.spyOn(Analytics, 'track').mockImplementation(() => {});
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
    const scheduledFor = '2019-07-12T23:37:00.000+05:30';

    JobsAnalytics.createJob({ jobId, scheduledFor });

    expectTrackCalledOnceWith(JobsAnalytics.EventName.CreateJob, {
      action: JobsAnalytics.JobAction.EntryPublish,
      job_id: jobId,
      scheduled_for: scheduledFor,
      timezone_offset: -120
    });
  });

  it('cancelJob', () => {
    const jobId = 'job-id';

    JobsAnalytics.cancelJob({ jobId });

    expectTrackCalledOnceWith(JobsAnalytics.EventName.CancelJob, {
      action: JobsAnalytics.JobAction.EntryPublish,
      job_id: jobId
    });
  });

  function expectTrackCalledOnceWith(eventName, payload) {
    expect(Analytics.track).toHaveBeenCalledTimes(1);
    expect(Analytics.track).toHaveBeenCalledWith(eventName, payload);
  }
});
