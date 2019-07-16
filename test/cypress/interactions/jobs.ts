import {
  defaultSpaceId,
  defaultEntryId,
  defaultJobId,
  defaultHeader
} from '../util/requests';
import * as state from '../util/interactionState';
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
    return cy.addInteraction({
      provider: 'jobs',
      state: state.Jobs.NO_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query for all jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(allJobsQuery),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.Jobs.NO_JOBS_FOR_DEFAULT_SPACE);
  },
  willFindSeveral() {
    return cy.addInteraction({
      provider: 'jobs',
      state: state.Jobs.SEVERAL_JOBS_FOR_DEFAULT_SPACE,
      uponReceiving: `a query for all jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(allJobsQuery),
      willRespondWith: {
        status: 200,
        body: severalJobsResponseBody
      }
    }).as(state.Jobs.SEVERAL_JOBS_FOR_DEFAULT_SPACE);
  },
  willFailWithAnInternalServerError() {
    return cy.addInteraction({
      provider: 'jobs',
      state: state.Jobs.INTERNAL_SERVER_ERROR,
      uponReceiving: `a query for all jobs in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(allJobsQuery),
      willRespondWith: {
        status: 500,
        body: empty
      }
    }).as(state.Jobs.INTERNAL_SERVER_ERROR);
  }
}

export const queryAllScheduledJobsForDefaultEntry = {
  willFindNone() {
    return cy.addInteraction({
      provider: 'jobs',
      state: state.Jobs.NO_JOBS_SCHEDULED_FOR_DEFAULT_ENTRY,
      uponReceiving: `a query for all scheduled jobs of entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(entryIdQuery),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.Jobs.NO_JOBS_SCHEDULED_FOR_DEFAULT_ENTRY);
  },
  willFindOnePendingJob() {
    return cy.addInteraction({
      provider: 'jobs',
      state: state.Jobs.ONE_PENDING_JOB_SCHEDULED_FOR_DEFAULT_ENTRY,
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
    }).as(state.Jobs.ONE_PENDING_JOB_SCHEDULED_FOR_DEFAULT_ENTRY);
  },
  willFindOneFailedJob() {
    return cy.addInteraction({
      provider: 'jobs',
      state: state.Jobs.JOB_EXECUTION_FAILED,
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
    }).as(state.Jobs.JOB_EXECUTION_FAILED);
  },
  willFailWithAnInternalServerError() {
    return cy.addInteraction({
      provider: 'jobs',
      state: state.Jobs.INTERNAL_SERVER_ERROR,
      uponReceiving: `a query for all scheduled jobs of entry "${defaultEntryId}" in space "${defaultSpaceId}"`,
      withRequest: queryJobsForDefaultSpaceRequest(entryIdQuery),
      willRespondWith: {
        status: 500,
        body: {}
      }
    }).as(state.Jobs.INTERNAL_SERVER_ERROR);
  }
}

export const cancelDefaultJobInDefaultSpace = {
  willSucceed() {
    return cy.addInteraction({
      provider: 'jobs',
      state: state.Jobs.ONE_JOB_FOR_DEFAULT_SPACE,
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
    });
  }
}

export const createScheduledPublicationForDefaultSpace = {
  willSucceed() {
    return cy.addInteraction({
      provider: 'jobs',
      state: state.Jobs.NO_JOBS_FOR_DEFAULT_SPACE,
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
    });
  }
}
