import {
  defaultSpaceId,
  defaultEntryId,
  defaultJobId,
  defaultHeader
} from '../util/requests';
import { Query, RequestOptions } from '@pact-foundation/pact-web';

const empty = require('../fixtures/responses/empty.json');
export const severalJobsResponseBody = require('../fixtures/responses/jobs-several.json');
const allJobsQuery = {
  order: '-sys.scheduledAt',
  'sys.status': 'pending'
};
const entryIdQuery = {
  order: '-sys.scheduledAt',
  'sys.entity.sys.id': defaultEntryId
};

enum States {
  NO_JOBS_FOR_DEFAULT_SPACE = 'jobs/no-jobs-for-default-space',
  ONE_JOB_FOR_DEFAULT_SPACE = 'jobs/one-job-for-default-space',
  SEVERAL_JOBS_FOR_DEFAULT_SPACE = 'jobs/several-jobs-for-default-space',
  INTERNAL_SERVER_ERROR = 'jobs/internal-server-error',
  JOB_EXECUTION_FAILED = 'jobs/job-execution-failed',
  NO_JOBS_SCHEDULED_FOR_DEFAULT_ENTRY = 'jobs/no-jobs-scheduled-for-default-entry',
  ONE_PENDING_JOB_SCHEDULED_FOR_DEFAULT_ENTRY = 'jobs/one-pending-job-scheduled-for-default-entry'
}

function queryJobsForDefaultSpaceRequest(query: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/environments/master/jobs`,
    headers: {
      ...defaultHeader, 
      'x-contentful-enable-alpha-feature': 'scheduled-jobs'
    },
    query
  };
}

export const queryAllJobsForDefaultSpace = {
  willFindNone() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.NO_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query for all jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(allJobsQuery),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('queryAllJobsForDefaultSpace');

    return '@queryAllJobsForDefaultSpace';
  },
  willFindSeveral() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.SEVERAL_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query for all jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(allJobsQuery),
      willRespondWith: {
        status: 200,
        body: severalJobsResponseBody
      }
    }).as('queryAllJobsForDefaultSpace');

    return '@queryAllJobsForDefaultSpace';
  },
  willFailWithAnInternalServerError() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.INTERNAL_SERVER_ERROR,
      uponReceiving: `a query for all jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(allJobsQuery),
      willRespondWith: {
        status: 500,
        body: empty
      }
    }).as('queryAllJobsForDefaultSpace');

    return '@queryAllJobsForDefaultSpace';
  }
}

export const queryAllScheduledJobsForDefaultEntry = {
  willFindNone() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.NO_JOBS_SCHEDULED_FOR_DEFAULT_ENTRY,
      uponReceiving: `a query for all scheduled jobs of entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(entryIdQuery),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('queryAllScheduledJobsForDefaultEntry');

    return '@queryAllScheduledJobsForDefaultEntry';
  },
  willFindOnePendingJob() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.ONE_PENDING_JOB_SCHEDULED_FOR_DEFAULT_ENTRY,
      uponReceiving: `a query for all scheduled jobs of entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(entryIdQuery),
      willRespondWith: {
        status: 200,
        body: {
          sys: {
            type: 'Array'
          },
          total: 1,
          skip: 0,
          limit: 1000,
          items: [
            {
              sys: {
                id: defaultJobId,
                status: 'pending'
              },
              action: 'publish',
              scheduledAt: '2050-08-08T06:10:52.066Z'
            }
          ]
        }
      }
    }).as('queryAllScheduledJobsForDefaultEntry');

    return '@queryAllScheduledJobsForDefaultEntry';
  },
  willFindOneFailedJob() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.JOB_EXECUTION_FAILED,
      uponReceiving: `a query for all scheduled jobs of entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(entryIdQuery),
      willRespondWith: {
        status: 200,
        body: {
          sys: {
            type: 'Array'
          },
          total: 1,
          skip: 0,
          limit: 1000,
          items: [
            {
              sys: {
                id: defaultJobId,
                status: 'failed'
              },
              action: 'publish',
              scheduledAt: '2050-08-08T06:10:52.066Z'
            }
          ]
        }
      }
    }).as('queryAllScheduledJobsForDefaultEntry');

    return '@queryAllScheduledJobsForDefaultEntry';
  },
  willFailWithAnInternalServerError() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.INTERNAL_SERVER_ERROR,
      uponReceiving: `a query for all scheduled jobs of entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(entryIdQuery),
      willRespondWith: {
        status: 500,
        body: {}
      }
    }).as('queryAllScheduledJobsForDefaultEntry');

    return '@queryAllScheduledJobsForDefaultEntry';
  }
}

export const cancelDefaultJobInDefaultSpace = {
  willSucceed() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.ONE_JOB_FOR_DEFAULT_SPACE,
      uponReceiving: `a request to cancel the job "${defaultJobId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'DELETE',
        path: `/spaces/${defaultSpaceId}/environments/master/jobs/${defaultJobId}`,
        headers: { 
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'scheduled-jobs'
        }
      },
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('cancelDefaultJobInDefaultSpace');

    return '@cancelDefaultJobInDefaultSpace';;
  }
}

export const createScheduledPublicationForDefaultSpace = {
  willSucceed() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.NO_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a request to create a scheduling publication for space "${defaultSpaceId}"`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/environments/master/jobs`,
        headers: {
          Accept: 'application/json, text/plain, */*',
          'x-contentful-enable-alpha-feature': 'scheduled-jobs'
        }
        // TODO: test body and figure out how to be with datetime.
      },
      willRespondWith: {
        status: 200,
        body: {
          sys: {
            id: defaultJobId,
            status: 'pending'
          },
          action: 'publish',
          scheduledAt: '2050-08-08T06:10:52.066Z'
        }
      }
    }).as('createScheduledPublicationForDefaultSpace');

    return '@createScheduledPublicationForDefaultSpace';;
  }
}
