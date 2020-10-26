import {
  defaultSpaceId,
  defaultEntryId,
  defaultJobId,
  defaultHeader,
  defaultEnvironmentId,
  defaultReleaseId,
} from '../util/requests';
import { Query, RequestOptions } from '@pact-foundation/pact-web';

const empty = require('../fixtures/responses/empty.json');
const serverErrorResponse = require('../fixtures/responses/server-error.json');
import {
  severalPendingJobsResponse,
  oneFailedJobResponse,
  onePendingJobResponse,
  createJobResponse,
  severalFailedJobsResponse,
  severalCompletedJobsResponse,
} from '../fixtures/responses/jobs-several';
import { createJobRequest } from '../fixtures/requests/jobs';
const pendingJobsQuery = {
  'environment.sys.id': 'master',
  limit: '40',
  order: 'scheduledFor.datetime',
  'sys.status': 'scheduled',
};
const pendingJobsQueryWithoutLimit = {
  'environment.sys.id': 'master',
  order: 'scheduledFor.datetime',
  'sys.status': 'scheduled',
};
const completedJobsQuery = {
  'environment.sys.id': 'master',
  limit: '40',
  order: '-scheduledFor.datetime',
  'sys.status': 'succeeded',
};
const failedJobsQuery = {
  'environment.sys.id': 'master',
  limit: '40',
  order: '-scheduledFor.datetime',
  'sys.status': 'failed',
};
const entryIdQuery = {
  'entity.sys.id': defaultEntryId,
  'environment.sys.id': 'master',
  order: '-scheduledFor.datetime',
};
const releaseIdQuery = {
  'entity.sys.id': defaultReleaseId,
  'environment.sys.id': 'master',
  order: '-scheduledFor.datetime',
};

enum States {
  NO_JOBS_FOR_DEFAULT_SPACE = 'jobs/no-jobs-for-default-space',
  NO_RELEASE_JOBS_FOR_DEFAULT_SPACE = 'jobs/no-release-jobs-for-default-space',
  ONE_PENDING_JOB_SCHEDULED_FOR_DEFAULT_ENTRY = 'jobs/one-pending-job-scheduled-for-default-entry',
  ONE_PENDING_JOB_SCHEDULED_FOR_DEFAULT_RELEASE = 'jobs/one-pending-job-scheduled-for-default-release',
  SEVERAL_JOBS_FOR_DEFAULT_SPACE = 'jobs/several-jobs-for-default-space',
  JOB_EXECUTION_FAILED = 'jobs/job-execution-failed',
  RELEASE_JOB_EXECUTION_FAILED = 'jobs/release-job-execution-failed',
  MAX_PENDING_JOBS = 'jobs/max-pending-jobs',
  INTERNAL_SERVER_ERROR = 'jobs/internal-server-error',
}

function queryJobsForDefaultSpaceRequest(query: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/scheduled_actions`,
    headers: {
      ...defaultHeader,
    },
    query,
  };
}

export const queryPendingJobsForDefaultSpaceWithoutLimit = {
  willFindNone() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.NO_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query without limit for pending jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(pendingJobsQueryWithoutLimit),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: empty,
      },
    }).as('queryPendingJobsForDefaultSpace');

    return '@queryPendingJobsForDefaultSpace';
  },
  willFindSeveral() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.SEVERAL_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query without a limit for pending jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(pendingJobsQueryWithoutLimit),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalPendingJobsResponse(100), // Limit to 100
      },
    }).as('queryPendingJobsForDefaultSpace');

    return '@queryPendingJobsForDefaultSpace';
  },
};

export const queryPendingJobsForDefaultSpace = {
  willFindNone() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.NO_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query with limit for pending jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(pendingJobsQuery),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: empty,
      },
    }).as('queryPendingJobsForDefaultSpace');

    return '@queryPendingJobsForDefaultSpace';
  },
  willFindSeveral() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.SEVERAL_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query with limit for pending jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(pendingJobsQuery),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalPendingJobsResponse(),
      },
    }).as('queryPendingJobsForDefaultSpace');

    return '@queryPendingJobsForDefaultSpace';
  },
  willFailWithAnInternalServerError() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.INTERNAL_SERVER_ERROR,
      uponReceiving: `a query with limit for pending jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(pendingJobsQuery),
      willRespondWith: {
        status: 500,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: serverErrorResponse,
      },
    }).as('queryPendingJobsForDefaultSpace');

    return '@queryPendingJobsForDefaultSpace';
  },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: empty,
      },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalCompletedJobsResponse,
      },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: serverErrorResponse,
      },
    }).as('queryCompletedJobsForDefaultSpace');

    return '@queryCompletedJobsForDefaultSpace';
  },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: empty,
      },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalFailedJobsResponse,
      },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: serverErrorResponse,
      },
    }).as('queryFailedJobsForDefaultSpace');

    return '@queryFailedJobsForDefaultSpace';
  },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: empty,
      },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: onePendingJobResponse('Entry', defaultEntryId),
      },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: oneFailedJobResponse('Entry', defaultEntryId),
      },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: serverErrorResponse,
      },
    }).as('queryAllScheduledJobsForDefaultEntry');

    return '@queryAllScheduledJobsForDefaultEntry';
  },
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
          'environment.sys.id': defaultEnvironmentId,
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
      },
    }).as('cancelDefaultJobInDefaultSpace');

    return '@cancelDefaultJobInDefaultSpace';
  },
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
          'x-contentful-enable-alpha-feature': 'scheduled-jobs',
        },
        query: {
          'environment.sys.id': defaultEnvironmentId,
        },
        body: createJobRequest('Entry', defaultEntryId),
      },
      willRespondWith: {
        status: 201,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: createJobResponse('Entry', defaultEntryId),
      },
    }).as('createScheduledPublicationForDefaultSpace');

    return '@createScheduledPublicationForDefaultSpace';
  },
  willFailWithMaxPendingJobsError() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.MAX_PENDING_JOBS,
      uponReceiving: `a request to create a scheduling publication for space "${defaultSpaceId}" above the limit`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/scheduled_actions`,
        headers: {
          ...defaultHeader,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'x-contentful-enable-alpha-feature': 'scheduled-jobs',
        },
        query: {
          'environment.sys.id': defaultEnvironmentId,
        },
        body: createJobRequest('Entry', defaultEntryId),
      },
      willRespondWith: {
        status: 400,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
      },
    }).as('createScheduledPublicationForDefaultSpace');

    return '@createScheduledPublicationForDefaultSpace';
  },
};

export const createScheduledReleaseForDefaultSpace = {
  willSucceed() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.NO_RELEASE_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a request to create a scheduling release for space "${defaultSpaceId}"`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/scheduled_actions`,
        headers: {
          ...defaultHeader,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          'x-contentful-enable-alpha-feature': 'scheduled-jobs',
        },
        query: {
          'environment.sys.id': defaultEnvironmentId,
        },
        body: createJobRequest('Release', defaultReleaseId),
      },
      willRespondWith: {
        status: 201,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: createJobResponse('Release', defaultReleaseId),
      },
    }).as('createScheduledReleaseForDefaultSpace');

    return '@createScheduledReleaseForDefaultSpace';
  },
};

export const queryAllScheduledJobsForDefaultRelease = {
  willFindOnePendingJob() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.ONE_PENDING_JOB_SCHEDULED_FOR_DEFAULT_RELEASE,
      uponReceiving: `a query for all scheduled jobs of release "${defaultReleaseId}" in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(releaseIdQuery),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: onePendingJobResponse('Release', defaultReleaseId),
      },
    }).as('queryAllScheduledJobsForDefaultRelease');

    return '@queryAllScheduledJobsForDefaultRelease';
  },
  willFindOneFailedJob() {
    cy.addInteraction({
      provider: 'jobs',
      state: States.RELEASE_JOB_EXECUTION_FAILED,
      uponReceiving: `a query for all scheduled jobs of release "${defaultReleaseId}" in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(releaseIdQuery),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: oneFailedJobResponse('Release', defaultReleaseId),
      },
    }).as('queryAllScheduledJobsForDefaultRelease');

    return '@queryAllScheduledJobsForDefaultRelease';
  },
};
