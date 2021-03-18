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
          version: 2,
        },
      },
      {
        sys: {
          id: defaultEntryTestIds.testEntryId3,
          linkType: 'Entry',
          type: 'Link',
          version: 2,
        },
      },
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
        id: Matchers.somethingLike(defaultBulkActionTestId),
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

const defaultBulkActionTestId = 'testBulkActionId';

const getBulkActionRequest: any = {
  provider: 'bulk-actions',
  uponReceiving: `a request for BulkAction ${defaultBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
  withRequest: {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/bulk_actions/actions/${defaultBulkActionTestId}`,
    headers: defaultHeader,
  },
};

const publishBulkActionRequest: any = {
  provider: 'bulk-actions',
  uponReceiving: `a request to publish a BulkAction on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
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

export const getBulkAction = {
  willReturnStatusInProgress(): string {
    cy.addInteraction({
      ...getBulkActionRequest,
      state: BulkActionStates.ONE_COMPLETED,
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
    }).as('getSucceededBulkAction');

    return '@getSucceededBulkAction';
  },
  willReturnStatusSucceeded(): string {
    cy.addInteraction({
      ...getBulkActionRequest,
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
    }).as('getSucceededBulkAction');

    return '@getSucceededBulkAction';
  },

  willReturnStatusFailed(): string {
    cy.addInteraction({
      ...getBulkActionRequest,
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
    }).as('getFailedBulkAction');

    return '@getFailedBulkAction';
  },
};

export const publishBulkAction = {
  willSucceed(): string {
    cy.addInteraction({
      ...publishBulkActionRequest,
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
      ...publishBulkActionRequest,
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
