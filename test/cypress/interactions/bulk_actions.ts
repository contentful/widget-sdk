// import '@contentful/cypress-pact/add-commands';
import { Matchers } from '@pact-foundation/pact-web';
import { makeLink } from '@contentful/types';
import { merge as deepMerge } from 'lodash';

import {
  defaultHeader,
  defaultSpaceId,
  defaultEnvironmentId,
  defaultEntryId,
  defaultUserId,
  defaultEntryTestIds,
} from '../util/requests';

enum BulkActionStates {
  NO_BULK_ACTIONS = 'bulk-actions/no-bulk-actions-for-default-space',
  ONE_COMPLETED = 'bulk-actions/one-completed-bulk-action-for-default-entry',
  ONE_FAILED = 'bulk-actions/one-failed-bulk-action-default-entry',
  ONE_IN_PROGRESS = 'bulk-actions/one-bulk-action-in-progress',
  MAX_NUMBER_OF_JOBS = 'bulk-actions/maximum-number-of-jobs-for-default-space',
}

export const publishPayload = {
  entities: {
    sys: {
      type: 'Array',
    },
    items: [
      {
        sys: {
          id: defaultEntryTestIds.defaultId,
          type: 'Link',
          linkType: 'Entry',
          version: 1,
        },
      },
      {
        sys: {
          id: defaultEntryTestIds.testEntryId2,
          linkType: 'Entry',
          type: 'Link',
          version: 3,
        },
      },
      {
        sys: {
          id: defaultEntryTestIds.testEntryId3,
          linkType: 'Entry',
          type: 'Link',
          version: 3,
        },
      },
    ],
  },
};

export const validatePayload = {
  action: 'publish',
  entities: {
    sys: {
      type: 'Array',
    },
    items: [
      makeLink('Entry', defaultEntryTestIds.defaultId),
      makeLink('Entry', defaultEntryTestIds.testEntryId2),
      makeLink('Entry', defaultEntryTestIds.testEntryId3),
    ],
  },
};

export const versionMismatchError = {
  sys: {
    type: 'Error',
    id: 'BulkActionFailed',
  },
  message: 'Not all entities could be resolved',
  details: {
    errors: [
      {
        error: {
          sys: {
            type: 'Error',
            id: 'VersionMismatch',
          },
        },
        entity: {
          sys: {
            linkType: 'Entry',
            id: defaultEntryId,
            type: 'Link',
            version: 1,
          },
        },
      },
    ],
  },
};

export const bulkActionEntryNotFoundError = {
  sys: {
    type: 'Error',
    id: 'BulkActionFailed',
  },
  message: 'Cannot publish all content',
  details: {
    errors: [
      {
        entity: {
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: defaultEntryId,
            version: 1,
          },
        },
        error: {
          sys: {
            type: 'Error',
            id: 'NotFound',
          },
          message: 'The resource could not be found.',
          details: {
            type: 'Entry',
            id: defaultEntryId,
          },
        },
      },
    ],
  },
};

const bulkActionResponse = (overrides = {}) => {
  const mergedResponse = deepMerge(
    {
      sys: {
        type: 'BulkAction',
        id: Matchers.somethingLike(defaultPublishBulkActionTestId),
        space: makeLink('Space', defaultSpaceId),
        environment: makeLink('Environment', defaultEnvironmentId),
        createdAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
        updatedAt: Matchers.somethingLike('2020-12-15T17:12:43.531Z'),
        createdBy: makeLink('User', defaultUserId),
      },
      payload: {
        entities: Matchers.somethingLike({
          sys: {
            type: 'Array',
          },
          items: Matchers.eachLike(
            {
              sys: {
                id: 'testString',
                linkType: 'Entry or Asset',
                type: 'Link',
                version: 1,
              },
            },
            { min: 1 }
          ),
        }),
      },
    },
    overrides
  );

  return Matchers.like(mergedResponse);
};

const defaultContentTypeHeader = {
  'content-type': 'application/vnd.contentful.management.v1+json',
};

// Needs to be the same as in bulk-actions-api.
// Currently used for both publish and validate bulk actions.
const defaultPublishBulkActionTestId = 'testBulkActionId';

const getPublishBulkActionRequest: any = {
  provider: 'bulk-actions',
  withRequest: {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/bulk_actions/actions/${defaultPublishBulkActionTestId}`,
    headers: defaultHeader,
  },
};

const postPublishBulkActionRequest: any = {
  provider: 'bulk-actions',
  withRequest: {
    method: 'POST',
    path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/bulk_actions/publish`,
    headers: {
      ...defaultContentTypeHeader,
      ...defaultHeader,
    },
    body: publishPayload,
  },
};

const postValidateBulkActionRequest: any = {
  provider: 'bulk-actions',
  withRequest: {
    method: 'POST',
    path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/bulk_actions/validate`,
    headers: {
      ...defaultContentTypeHeader,
      ...defaultHeader,
    },
    body: validatePayload,
  },
};

export const getPublishBulkAction = {
  willReturnStatusInProgress(): string {
    cy.addInteraction({
      ...getPublishBulkActionRequest,
      uponReceiving: `a request to get a publish bulk action in progress ${defaultPublishBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.ONE_IN_PROGRESS,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: bulkActionResponse({
          sys: {
            status: 'inProgress',
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
          },
          action: 'publish',
        }),
      },
    }).as('getSucceededPublishBulkAction');

    return '@getSucceededPublishBulkAction';
  },
  willReturnStatusSucceeded(): string {
    cy.addInteraction({
      ...getPublishBulkActionRequest,
      uponReceiving: `a request to get a completed publish bulk action ${defaultPublishBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.ONE_COMPLETED,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: bulkActionResponse({
          sys: {
            status: 'succeeded',
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
            completedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
          },
          action: 'publish',
        }),
      },
    }).as('getSucceededPublishBulkAction');

    return '@getSucceededPublishBulkAction';
  },
  willReturnStatusFailed(): string {
    cy.addInteraction({
      ...getPublishBulkActionRequest,
      uponReceiving: `a request to get a failed publish bulk action ${defaultPublishBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.ONE_FAILED,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: bulkActionResponse({
          sys: {
            status: 'failed',
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
            completedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
          },
          action: 'publish',
          error: versionMismatchError,
        }),
      },
    }).as('getFailedPublishBulkAction');

    return '@getFailedPublishBulkAction';
  },
};

export const publishBulkAction = {
  willSucceed(): string {
    cy.addInteraction({
      ...postPublishBulkActionRequest,
      uponReceiving: `a request to create a publish bulk action on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.NO_BULK_ACTIONS,
      willRespondWith: {
        status: 201,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: bulkActionResponse({ action: 'publish', sys: { status: 'created' } }),
      },
    }).as('publishBulkAction');

    return '@publishBulkAction';
  },
  willFailWithTooManyRequests(): string {
    cy.addInteraction({
      ...postPublishBulkActionRequest,
      uponReceiving: `a failing request to create a publish bulk action on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.MAX_NUMBER_OF_JOBS,
      willRespondWith: {
        status: 429,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: {
          sys: {
            id: 'RateLimitExceeded',
            type: 'Error',
          },
        },
      },
    }).as('publishBulkActionFailure');

    return '@publishBulkActionFailure';
  },
};

export const getValidateBulkAction = {
  willReturnStatusInProgress(): string {
    cy.addInteraction({
      ...getPublishBulkActionRequest,
      uponReceiving: `a request to get a validate bulk action in progress ${defaultPublishBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.ONE_IN_PROGRESS,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: bulkActionResponse({
          sys: {
            status: 'inProgress',
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
          },
          action: 'validate',
        }),
      },
    }).as('getSucceededValidateBulkAction');

    return '@getSucceededValidateBulkAction';
  },
  willReturnStatusSucceeded(): string {
    cy.addInteraction({
      ...getPublishBulkActionRequest,
      uponReceiving: `a request to get a completed validate bulk action ${defaultPublishBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.ONE_COMPLETED,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: bulkActionResponse({
          sys: {
            status: 'succeeded',
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
            completedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
          },
          action: 'validate',
        }),
      },
    }).as('getSucceededValidateBulkAction');

    return '@getSucceededValidateBulkAction';
  },
  willReturnStatusFailed(): string {
    cy.addInteraction({
      ...getPublishBulkActionRequest,
      uponReceiving: `a request to get a failed validate bulk action ${defaultPublishBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.ONE_FAILED,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: bulkActionResponse({
          sys: {
            status: 'failed',
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
            completedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
          },
          action: 'validate',
          error: versionMismatchError,
        }),
      },
    }).as('getFailedValidateBulkAction');

    return '@getFailedValidateBulkAction';
  },
};

export const validateBulkAction = {
  willSucceed(): string {
    cy.addInteraction({
      ...postValidateBulkActionRequest,
      uponReceiving: `a request to create a validate bulk action on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.ONE_COMPLETED,
      willRespondWith: {
        status: 201,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: bulkActionResponse({
          action: 'validate',
          sys: { status: 'created' },
          payload: { action: 'publish' },
        }),
      },
    }).as('validateBulkAction');

    return '@validateBulkAction';
  },
  willFailWithTooManyRequests(): string {
    cy.addInteraction({
      ...postValidateBulkActionRequest,
      uponReceiving: `a failing request to create a validate bulk action on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.MAX_NUMBER_OF_JOBS,
      willRespondWith: {
        status: 429,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: {
          sys: {
            id: 'RateLimitExceeded',
            type: 'Error',
          },
        },
      },
    }).as('validateBulkActionFailure');

    return '@validateBulkActionFailure';
  },
};
