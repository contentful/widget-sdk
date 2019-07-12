import {
  getEntryJobs,
  cancelJob,
  defaultSpaceId,
  defaultEntryId,
  defaultJobId
} from '../util/requests';
import * as state from '../util/interactionState';

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

export function noJobsResponse() {
  cy.addInteraction({
    provider: 'jobs',
    state: 'noJobs',
    uponReceiving: 'a request for all jobs',
    withRequest: getEntryJobs(defaultSpaceId, allJobsQuery),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Jobs.NONE);
}

export function noJobsForSpecificEntryIdResponse() {
  cy.addInteraction({
    provider: 'jobs',
    state: 'noJobsForSpecificEntry',
    uponReceiving: 'a request for all jobs',
    withRequest: getEntryJobs(defaultSpaceId, entryIdQuery),
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Jobs.NONE);
}

export function severalJobsResponse() {
  cy.addInteraction({
    provider: 'jobs',
    state: state.Jobs.SEVERAL,
    uponReceiving: 'a request for all jobs',
    withRequest: getEntryJobs(defaultSpaceId, allJobsQuery),
    willRespondWith: {
      status: 200,
      body: severalJobsResponseBody
    }
  }).as(state.Jobs.SEVERAL);
}

export function cancelJobResponse() {
  return cy.addInteraction({
    provider: 'jobs',
    state: state.Jobs.SINGLE,
    uponReceiving: 'a request for all jobs',
    withRequest: cancelJob(),
    willRespondWith: {
      status: 200,
      body: empty
    }
  });
}

export function jobsErrorResponse() {
  cy.addInteraction({
    provider: 'jobs',
    state: state.Jobs.INTERNAL_SERVER_ERROR,
    uponReceiving: 'a request for all jobs',
    withRequest: getEntryJobs(defaultSpaceId, allJobsQuery),
    willRespondWith: {
      status: 500,
      body: empty
    }
  }).as(state.Jobs.INTERNAL_SERVER_ERROR);
}

export function singleJobForEntryResponse() {
  cy.addInteraction({
    provider: 'jobs',
    state: state.Jobs.SINGLE,
    uponReceiving: 'a request for the default entry schedules',
    withRequest: getEntryJobs(defaultSpaceId, entryIdQuery),
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
  }).as(state.Jobs.SINGLE);
}
export function singleFailedJobForEntryResponse() {
  cy.addInteraction({
    provider: 'jobs',
    state: state.Jobs.JOB_EXECUTION_FAILED,
    uponReceiving: 'a request for entry schedules',
    withRequest: getEntryJobs(defaultSpaceId, entryIdQuery),
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
}

export function jobIsCreatedPostResponse() {
  return cy.addInteraction({
    provider: 'jobs',
    state: state.Jobs.NONE,
    uponReceiving: 'a post request for scheduling publication',
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

export function unavailableJobsForEntryResponse() {
  cy.addInteraction({
    provider: 'jobs',
    state: state.Jobs.INTERNAL_SERVER_ERROR,
    uponReceiving: 'a request for entry schedules',
    withRequest: getEntryJobs(defaultSpaceId, entryIdQuery),
    willRespondWith: {
      status: 500,
      body: {}
    }
  }).as(state.Jobs.INTERNAL_SERVER_ERROR);
}
