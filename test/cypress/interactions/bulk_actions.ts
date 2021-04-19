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
  EMPTY = 'bulk-actions/no-bulk-actions-for-default-space',
  MAX_NUMBER_OF_JOBS = 'bulk-actions/maximum-number-of-jobs-for-default-space',
  COMPLETED = 'bulk-actions/completed-bulk-actions-for-default-space',
  FAILED = 'bulk-actions/failed-bulk-actions-for-default-space',
  IN_PROGRESS = 'bulk-actions/bulk-actions-in-progress-for-default-space',
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

// Use a very loose definition since matchers aren't compatible with the defined API shape
type BulkActionResponse<TPayload = any> = Record<string, any> & { payload: TPayload };

const bulkActionResponse = (overrides: BulkActionResponse) => {
  const mergedResponse = deepMerge(
    {
      sys: {
        type: 'BulkAction',
        space: makeLink('Space', defaultSpaceId),
        environment: makeLink('Environment', defaultEnvironmentId),
        createdAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
        updatedAt: Matchers.somethingLike('2020-12-15T17:12:43.531Z'),
        createdBy: makeLink('User', defaultUserId),
      },
    },
    overrides
  );

  return Matchers.like(mergedResponse);
};

/**
 * Given a Matcher shape for an item returns a Contentful collection matcher
 *
 * @param itemMatcher the shape that each item in the entities.items should look like
 * @returns a Matcher.somethingLike for the collection
 * @example
 * > toCollectionMatcher({
 *   sys: {
 *     type: 'Link',
 *     linkType: Matcher.regex({ generate: 'Entry', matcher: 'Entry|Asset' }),
 *     id: Matcher.string('myTestId')
 *   }
 * })
 * > _
 * {
 *   sys: { type: 'Array' },
 *   items: Matchers.eachLike(..., { min: 1 }),
 * }
 */
const toCollectionMatcher = (itemMatcher) =>
  Matchers.somethingLike({
    sys: {
      type: 'Array',
    },
    items: Matchers.eachLike(itemMatcher, { min: 1 }),
  });

const publishBulkActionResponse = (overrides = {}) => {
  const publishOverrides = deepMerge(
    {
      sys: {
        id: Matchers.somethingLike(defaultPublishBulkActionTestId),
      },
      action: 'publish',
      payload: {
        entities: toCollectionMatcher({
          sys: {
            type: 'Link',
            id: 'testString',
            linkType: Matchers.regex({ generate: 'Entry', matcher: 'Entry|Asset' }),
            version: Matchers.integer(1),
          },
        }),
      },
    },
    overrides
  );
  return bulkActionResponse(publishOverrides);
};

const validateBulkActionResponse = (overrides = {}) => {
  const validateOverrides = deepMerge(
    {
      sys: {
        id: Matchers.somethingLike(defaultValidateBulkActionTestId),
      },
      action: 'validate',
      payload: {
        entities: toCollectionMatcher({
          sys: {
            type: 'Link',
            id: 'testString',
            linkType: Matchers.regex({ generate: 'Entry', matcher: 'Entry|Asset' }),
          },
        }),
      },
    },
    overrides
  );
  return bulkActionResponse(validateOverrides);
};

const defaultContentTypeHeader = {
  'content-type': 'application/vnd.contentful.management.v1+json',
};

const defaultPublishBulkActionTestId = 'testPublishBulkActionId';
const defaultValidateBulkActionTestId = 'testValidateBulkActionId';

const getPublishBulkActionRequest: any = {
  provider: 'bulk-actions',
  withRequest: {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/bulk_actions/actions/${defaultPublishBulkActionTestId}`,
    headers: defaultHeader,
  },
};

const getValidateBulkActionRequest: any = {
  provider: 'bulk-actions',
  withRequest: {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/bulk_actions/actions/${defaultValidateBulkActionTestId}`,
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
      state: BulkActionStates.IN_PROGRESS,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: publishBulkActionResponse({
          sys: {
            status: 'inProgress',
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
          },
        }),
      },
    }).as('getSucceededPublishBulkAction');

    return '@getSucceededPublishBulkAction';
  },
  willReturnStatusSucceeded(): string {
    cy.addInteraction({
      ...getPublishBulkActionRequest,
      uponReceiving: `a request to get a completed publish bulk action ${defaultPublishBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.COMPLETED,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: publishBulkActionResponse({
          sys: {
            status: 'succeeded',
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
            completedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
          },
        }),
      },
    }).as('getSucceededPublishBulkAction');

    return '@getSucceededPublishBulkAction';
  },
  willReturnStatusFailed(): string {
    cy.addInteraction({
      ...getPublishBulkActionRequest,
      uponReceiving: `a request to get a failed publish bulk action ${defaultPublishBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.FAILED,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: publishBulkActionResponse({
          sys: {
            status: 'failed',
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
            completedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
          },
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
      state: BulkActionStates.EMPTY,
      willRespondWith: {
        status: 201,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: publishBulkActionResponse({ sys: { status: 'created' } }),
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
      ...getValidateBulkActionRequest,
      uponReceiving: `a request to get a validate bulk action in progress ${defaultValidateBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.IN_PROGRESS,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: validateBulkActionResponse({
          sys: {
            status: 'inProgress',
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
          },
        }),
      },
    }).as('getSucceededValidateBulkAction');

    return '@getSucceededValidateBulkAction';
  },
  willReturnStatusSucceeded(): string {
    cy.addInteraction({
      ...getValidateBulkActionRequest,
      uponReceiving: `a request to get a completed validate bulk action ${defaultValidateBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.COMPLETED,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: validateBulkActionResponse({
          sys: {
            status: 'succeeded',
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
            completedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
          },
        }),
      },
    }).as('getSucceededValidateBulkAction');

    return '@getSucceededValidateBulkAction';
  },
  willReturnStatusFailed(): string {
    cy.addInteraction({
      ...getPublishBulkActionRequest,
      uponReceiving: `a request to get a failed validate bulk action ${defaultValidateBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
      state: BulkActionStates.FAILED,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: validateBulkActionResponse({
          sys: {
            status: 'failed',
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
            completedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
          },
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
      state: BulkActionStates.EMPTY,
      willRespondWith: {
        status: 201,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: validateBulkActionResponse({
          sys: { status: 'created' },
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
