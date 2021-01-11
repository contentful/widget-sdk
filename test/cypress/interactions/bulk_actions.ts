// import '@contentful/cypress-pact/add-commands';
import { Matchers } from '@pact-foundation/pact-web';

import {
  defaultHeader,
  defaultSpaceId,
  defaultEnvironmentId,
  defaultEntryId,
  defaultUserId,
} from '../util/requests';

enum BulkActionStates {
  NO_BULK_ACTIONS = 'bulk-actions/no-bulk-actions-for-default-space',
  ONE_COMPLETED = 'bulk-actions/one-completed-bulk-action-for-default-entry',
  ONE_FAILED = 'bulk-actions/one-failed-bulk-action-default-entry',
  SEVERAL = 'bulk-actions/maximum-number-of-jobs-for-default-space',
}

const publishPayload = [
  {
    sys: {
      type: 'Link',
      linkType: 'Entry',
      id: defaultEntryId,
      version: 1,
    },
  },
  {
    sys: {
      id: 'testEntryId1',
      linkType: 'Entry',
      type: 'Link',
      version: 1,
    },
  },
  {
    sys: {
      id: 'testEntryId2',
      linkType: 'Entry',
      type: 'Link',
      version: 1,
    },
  },
];

const defaultContentTypeHeader = {
  'Content-Type': 'application/vnd.contentful.management.v1+json',
};

const defaultBulkActionTestId = 'testBulkActionId';

const getBulkActionRequest: any = {
  provider: 'bulk_actions',
  uponReceiving: `a request for BulkAction ${defaultBulkActionTestId} on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
  withRequest: {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/bulk_actions/actions/${defaultBulkActionTestId}`,
    headers: defaultHeader,
  },
};

const publishBulkActionRequest: any = {
  provider: 'bulk_actions',
  uponReceiving: `a request to publish a BulkAction on space ${defaultSpaceId} and ${defaultEnvironmentId} environment`,
  withRequest: {
    method: 'POST',
    path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/bulk_actions/publish`,
    headers: defaultHeader,
    body: Matchers.like({
      entities: {
        items: publishPayload,
      },
    }),
  },
};

export const getBulkAction = {
  willSucceed(): string {
    cy.addInteraction({
      ...getBulkActionRequest,
      state: BulkActionStates.ONE_COMPLETED,
      willRespondWith: {
        status: 200,
        headers: {
          ...defaultContentTypeHeader,
        },
        body: Matchers.like({
          sys: {
            type: 'BulkAction',
            id: defaultBulkActionTestId,
            space: {
              sys: {
                type: 'Link',
                linkType: 'Space',
                id: defaultSpaceId,
              },
            },
            environment: {
              sys: {
                type: 'Link',
                linkType: 'Environment',
                id: defaultEnvironmentId,
              },
            },
            createdAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
            updatedAt: Matchers.somethingLike('2020-12-15T17:12:43.531Z'),
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.252Z'),
            completedAt: Matchers.somethingLike('2020-12-15T17:12:43.531Z'),
            createdBy: {
              sys: {
                type: 'Link',
                linkType: 'User',
                id: defaultUserId,
              },
            },
            status: 'succeeded',
          },
          action: 'publish',
          payload: {
            entities: {
              items: publishPayload,
            },
          },
        }),
      },
    }).as('getBulkAction');

    return '@getBulkAction';
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
        body: Matchers.like({
          sys: {
            type: 'BulkAction',
            id: defaultBulkActionTestId,
            space: {
              sys: {
                type: 'Link',
                linkType: 'Space',
                id: defaultSpaceId,
              },
            },
            environment: {
              sys: {
                type: 'Link',
                linkType: 'Environment',
                id: defaultEnvironmentId,
              },
            },
            createdAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
            updatedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
            startedAt: Matchers.somethingLike('2020-12-15T17:12:43.215Z'),
            completedAt: null,
            createdBy: {
              sys: {
                type: 'Link',
                linkType: 'User',
                id: defaultUserId,
              },
            },
            status: 'created',
          },
          action: 'publish',
          payload: {
            entities: {
              items: publishPayload,
            },
          },
        }),
      },
    }).as('publishBulkAction');

    return '@publishBulkAction';
  },
};
