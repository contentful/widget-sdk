import * as Analytics from 'analytics/Analytics';
import * as Intercom from 'services/intercom';
import * as JobsAnalytics from './ScheduledActionsAnalytics';
import ScheduledActionAction from '../ScheduledActionAction';

jest.mock('analytics/Analytics');
jest.mock('moment-timezone');

const checkCreateAndCancelActions = (entityType) => {
  [ScheduledActionAction.Publish, ScheduledActionAction.Unpublish].forEach((action) => {
    const eventAction = `${entityType}.${action}`;

    it(`create scheduled action with action ${action}`, () => {
      const jobId = 'job-id';
      const entityId = 'entity-id';
      const scheduledFor = {
        datetime: '2019-07-12T23:37:00.000+05:30',
      };

      const job = {
        entity: {
          sys: {
            id: entityId,
            type: 'Link',
            linkType: entityType,
          },
        },
        sys: {
          id: jobId,
        },
        action: action,
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

    it(`cancel scheduled action with action ${action}`, () => {
      const jobId = 'job-id';

      const job = {
        sys: {
          id: jobId,
        },
        action: action,
        entity: {
          sys: {
            type: 'Link',
            linkType: entityType,
          },
        },
      };

      JobsAnalytics.cancelJob(job);

      expectTrackCalledOnceWith('jobs:cancel', {
        action: eventAction,
        job_id: jobId,
      });
    });
  });
};

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
      purpose: 'create',
      action: 'open',
    });
  });

  it('Dialog close after cancel', () => {
    JobsAnalytics.createDialogClose();

    expectTrackCalledOnceWith('global:dialog', {
      name: 'jobs:create',
      action: 'close',
      purpose: 'cancel',
    });
  });

  it('Dialog close after submit', () => {
    JobsAnalytics.createDialogClose(true);

    expectTrackCalledOnceWith('global:dialog', {
      name: 'jobs:create',
      action: 'close',
      purpose: 'submit',
    });
  });

  describe('Entity type: Entry', () => {
    checkCreateAndCancelActions('Entry');
  });

  describe('Entity type: Asset', () => {
    checkCreateAndCancelActions('Asset');
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
