import { defaultSpaceId, defaultEntryId, defaultJobId, defaultHeader } from '../util/requests';
import { Query, RequestOptions } from '@pact-foundation/pact-web';

const empty = require('../fixtures/responses/empty.json');
const serverErrorResponse = require('../fixtures/responses/server-error.json');
import {
  severalPendingJobsResponse,
  oneFailedJobResponse,
  onePendingJobResponse,
  createJobResponse,
  severalFailedJobsResponse,
  severalCompletedJobsResponse
} from '../fixtures/responses/jobs-several';
import { createJobRequest } from '../fixtures/requests/jobs';
const pendingJobsQuery = {
  order: 'sys.scheduledAt',
  'sys.status': 'pending'
};
const completedJobsQuery = {
  order: '-sys.scheduledAt',
  'sys.status': 'done'
};
const failedJobsQuery = {
  order: '-sys.scheduledAt',
  'sys.status': 'failed'
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
  //NO_JOBS_SCHEDULED_FOR_DEFAULT_ENTRY = 'jobs/no-jobs-scheduled-for-default-entry',
  ONE_PENDING_JOB_SCHEDULED_FOR_DEFAULT_ENTRY = 'jobs/one-pending-job-scheduled-for-default-entry',
  MAX_PENDING_JOBS = 'jobs/max-pending-jobs'
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

export const queryPendingJobsForDefaultSpace = {
  willFindNone() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.NO_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query for pending jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(pendingJobsQuery),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('queryPendingJobsForDefaultSpace');

    return '@queryPendingJobsForDefaultSpace';
  },
  willFindSeveral() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.SEVERAL_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query for pending jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(pendingJobsQuery),
      willRespondWith: {
        status: 200,
        body: severalPendingJobsResponse
      }
    }).as('queryPendingJobsForDefaultSpace');

    return '@queryPendingJobsForDefaultSpace';
  },
  willFailWithAnInternalServerError() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.INTERNAL_SERVER_ERROR,
      uponReceiving: `a query for pending jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(pendingJobsQuery),
      willRespondWith: {
        status: 500,
        body: serverErrorResponse
      }
    }).as('queryPendingJobsForDefaultSpace');

    return '@queryPendingJobsForDefaultSpace';
  }
};

export const queryCompletedJobsForDefaultSpace = {
  willFindNone() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.NO_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query for completed jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(completedJobsQuery),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('queryCompletedJobsForDefaultSpace');

    return '@queryCompletedJobsForDefaultSpace';
  },
  willFindSeveral() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.SEVERAL_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query for completed jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(completedJobsQuery),
      willRespondWith: {
        status: 200,
        body: severalCompletedJobsResponse
      }
    }).as('queryCompletedJobsForDefaultSpace');

    return '@queryCompletedJobsForDefaultSpace';
  },
  willFailWithAnInternalServerError() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.INTERNAL_SERVER_ERROR,
      uponReceiving: `a query for completed jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(completedJobsQuery),
      willRespondWith: {
        status: 500,
        body: serverErrorResponse
      }
    }).as('queryCompletedJobsForDefaultSpace');

    return '@queryCompletedJobsForDefaultSpace';
  }
};

export const queryFailedJobsForDefaultSpace = {
  willFindNone() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.NO_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query for failed jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(failedJobsQuery),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('queryFailedJobsForDefaultSpace');

    return '@queryFailedJobsForDefaultSpace';
  },
  willFindSeveral() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.SEVERAL_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query for failed jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(failedJobsQuery),
      willRespondWith: {
        status: 200,
        body: severalFailedJobsResponse
      }
    }).as('queryFailedJobsForDefaultSpace');

    return '@queryFailedJobsForDefaultSpace';
  },
  willFailWithAnInternalServerError() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.INTERNAL_SERVER_ERROR,
      uponReceiving: `a query for failed jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(failedJobsQuery),
      willRespondWith: {
        status: 500,
        body: serverErrorResponse
      }
    }).as('queryFailedJobsForDefaultSpace');

    return '@queryFailedJobsForDefaultSpace';
  }
};

export const queryAllScheduledJobsForDefaultEntry = {
  willFindNone() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.NO_JOBS_FOR_DEFAULT_SPACE,
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
        body: onePendingJobResponse
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
        body: oneFailedJobResponse
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
        body: serverErrorResponse
      }
    }).as('queryAllScheduledJobsForDefaultEntry');

    return '@queryAllScheduledJobsForDefaultEntry';
  }
};

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
        status: 200
      }
    }).as('cancelDefaultJobInDefaultSpace');

    return '@cancelDefaultJobInDefaultSpace';
  }
};

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
          ...defaultHeader,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'x-contentful-enable-alpha-feature': 'scheduled-jobs'
        },
        body: createJobRequest
      },
      willRespondWith: {
        status: 201,
        body: createJobResponse
      }
    }).as('createScheduledPublicationForDefaultSpace');

    return '@createScheduledPublicationForDefaultSpace';
  },
  willFailWithMaxPendingJobsError() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.MAX_PENDING_JOBS,
      uponReceiving: `a request to create a scheduling publication for space "${defaultSpaceId}"`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/environments/master/jobs`,
        headers: {
          ...defaultHeader,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'x-contentful-enable-alpha-feature': 'scheduled-jobs'
        },
        body: createJobRequest
      },
      willRespondWith: {
        status: 400
      }
    }).as('createScheduledPublicationForDefaultSpace');

    return '@createScheduledPublicationForDefaultSpace';
  }
};
