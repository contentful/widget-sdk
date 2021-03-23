import { BulkAction as BasicBulkAction, makeLink, VersionedLink } from '@contentful/types';

const testEntryId = 'testEntryId';
const testAssetId = 'testAssetId';
const testBulkActionId = 'testBulkActionId';

type BulkAction = BasicBulkAction | { error: any };

const versionedLink = ({ type, id, version = 0 }): VersionedLink => ({
  sys: {
    id,
    version,
    linkType: type,
    type: 'Link',
  },
});

const versionedEntries = [
  versionedLink({ type: 'Entry', id: testEntryId, version: 1 }),
  versionedLink({ type: 'Asset', id: testAssetId, version: 1 }),
  versionedLink({ type: 'Entry', id: 'testEntryId1', version: 1 }),
  versionedLink({ type: 'Asset', id: 'testAssetId1', version: 1 }),
];

const notVersionedEntries = [
  makeLink('Entry', testEntryId),
  makeLink('Asset', testAssetId),
  makeLink('Entry', 'testEntryId1'),
  makeLink('Asset', 'testAssetId1'),
];

const bulkPublishResponsePayload = {
  entities: {
    items: versionedEntries,
    sys: {
      type: 'Array',
    },
  },
};

const bulkValidateResponsePayload = {
  action: 'publish',
  entities: {
    items: notVersionedEntries,
    sys: {
      type: 'Array',
    },
  },
};

export type BulkActionError = {
  details?: Record<string, any>;
  message: string;
  sys: {
    type: 'Error';
    id: 'BulkActionFailed';
  };
};

export const versionMismatchError: BulkActionError = {
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
            id: testEntryId,
            type: 'Link',
            version: 1,
          },
        },
      },
    ],
  },
};

export const validationFailedError: BulkActionError = {
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
            id: 'ValidationFailed',
          },
          message: 'Validation error',
          details: {
            errors: [
              {
                name: 'required',
                path: ['fields', 'requiredText'],
                details: 'The property "requiredText" is required here',
              },
            ],
          },
        },
        entity: {
          sys: {
            linkType: 'Entry',
            id: testEntryId,
            type: 'Link',
            version: 1,
          },
        },
      },
    ],
  },
};

export type TransformedBulkActionError = {
  statusCode: number;
  data: { details?: BulkActionError['details'] };
};

// Same as `toErrorDataFormat` - all bulk actions related errors are transformed into this format
export const toBulkActionErrorResponse = (
  error: BulkActionError,
  statusCode = 400
): TransformedBulkActionError => {
  return {
    statusCode,
    data: { details: error?.details },
  };
};

type ResponseOptions = {
  status?: 'created' | 'inProgress' | 'succeeded' | 'failed';
  action?: 'publish' | 'validate';
  payload?: typeof bulkPublishResponsePayload | typeof bulkValidateResponsePayload;
  error?: BulkActionError;
};

const bulkActionResponse = ({
  action = 'publish',
  status = 'created',
  payload = bulkPublishResponsePayload,
  error,
}: ResponseOptions): BulkAction => {
  const response: BulkAction = {
    sys: {
      type: 'BulkAction',
      id: testBulkActionId,
      space: makeLink('Space', 'spaceId'),
      environment: makeLink('Environment', 'master'),
      createdAt: '2020-12-15T17:12:43.215Z',
      updatedAt: '2020-12-15T17:12:43.531Z',
      startedAt: '2020-12-15T17:12:43.252Z',
      completedAt: status === 'succeeded' ? '2020-12-15T17:12:43.531Z' : undefined,
      createdBy: makeLink('User', 'userId'),
      status,
    },
    action,
    payload,
  };
  if (error) {
    response.error = error;
  }
  return response;
};

const publishBulkActionSuccessResponse = bulkActionResponse({
  status: 'succeeded',
  action: 'publish',
});

const validateBulkActionSuccessResponse = bulkActionResponse({
  status: 'succeeded',
  action: 'validate',
  payload: bulkValidateResponsePayload,
});

const bulkActionVersionMismatchErrorResponse = toBulkActionErrorResponse(
  bulkActionResponse({
    action: 'publish',
    status: 'failed',
    payload: bulkPublishResponsePayload,
    error: versionMismatchError,
  }).error
);

const bulkActionEntryErrorResponse = toBulkActionErrorResponse(
  bulkActionResponse({
    status: 'failed',
    action: 'publish',
    error: validationFailedError,
  }).error
);

export {
  publishBulkActionSuccessResponse,
  validateBulkActionSuccessResponse,
  bulkActionVersionMismatchErrorResponse,
  bulkActionEntryErrorResponse,
};
