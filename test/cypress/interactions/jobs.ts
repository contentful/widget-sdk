import { defaultSpaceId, defaultEntryId, defaultJobId, defaultHeader, defaultEnvironmentId } from '../util/requests';
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
  'environment.sys.id': 'master',
  order: 'scheduledFor.datetime',
  'sys.status': 'scheduled'
};
const completedJobsQuery = {
  'environment.sys.id': 'master',
  order: '-scheduledFor.datetime',
  'sys.status': 'succeeded'
};
const failedJobsQuery = {
  'environment.sys.id': 'master',
  order: '-scheduledFor.datetime',
  'sys.status': 'failed'
};
const entryIdQuery = {
  'entity.sys.id': defaultEntryId,
  'environment.sys.id': 'master',
  order: '-scheduledFor.datetime'
};

enum States {
  NO_JOBS_FOR_DEFAULT_SPACE = 'jobs/no-jobs-for-default-space',
  ONE_PENDING_JOB_SCHEDULED_FOR_DEFAULT_ENTRY = 'jobs/one-pending-job-scheduled-for-default-entry',
  SEVERAL_JOBS_FOR_DEFAULT_SPACE = 'jobs/several-jobs-for-default-space',
  JOB_EXECUTION_FAILED = 'jobs/job-execution-failed',
  MAX_PENDING_JOBS = 'jobs/max-pending-jobs',
  INTERNAL_SERVER_ERROR = 'jobs/internal-server-error'
}

function queryJobsForDefaultSpaceRequest(query: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/scheduled_actions`,
    headers: {
      ...defaultHeader
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
      state: States.ONE_PENDING_JOB_SCHEDULED_FOR_DEFAULT_ENTRY,
      uponReceiving: `a request to cancel the job "${defaultJobId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'DELETE',
        path: `/spaces/${defaultSpaceId}/scheduled_actions/${defaultJobId}`,
        headers: {
          ...defaultHeader,
        },
        query: {
          'environment.sys.id': defaultEnvironmentId
        },
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
        path: `/spaces/${defaultSpaceId}/scheduled_actions`,
        headers: {
          ...defaultHeader,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'x-contentful-enable-alpha-feature': 'scheduled-jobs'
        },
        query: {
          'environment.sys.id': defaultEnvironmentId
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
        path: `/spaces/${defaultSpaceId}/scheduled_actions`,
        headers: {
          ...defaultHeader,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'x-contentful-enable-alpha-feature': 'scheduled-jobs'
        },
        query: {
          'environment.sys.id': defaultEnvironmentId
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
