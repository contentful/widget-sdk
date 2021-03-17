import { BulkAction, makeLink, VersionedLink } from '@contentful/types';

const testEntryId = 'testEntryId';
const testAssetId = 'testAssetId';
const testBulkActionId = 'testBulkActionId';

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
    items: versionedEntries,
    sys: {
      type: 'Array',
    },
  },
};

const versionMismatchError = {
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

const validationFailedError = {
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

const serverError = {
  sys: {
    type: 'Error',
    id: 'ServerError',
  },
  details: {},
};

type ResponseOptions = {
  action: 'publish' | 'validate';
  payload?: typeof bulkValidateResponsePayload | typeof bulkPublishResponsePayload;
  status: 'created' | 'inProgress' | 'succeeded' | 'failed';
};

const bulkActionResponse = ({
  action = 'publish',
  status = 'created',
  payload = bulkPublishResponsePayload,
}: ResponseOptions): BulkAction => {
  const response = {
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
  return response as BulkAction;
};

type BulkActionError = { details?: Record<string, any> };
type BulkActionErrorResponse = {
  statusCode: number;
  data: { details?: BulkActionError['details'] };
};

const bulkActionResponseError = (
  error: BulkActionError,
  statusCode = 400
): BulkActionErrorResponse => {
  return {
    statusCode,
    data: { details: error?.details },
  };
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

const bulkActionVersionMismatchErrorResponse = bulkActionResponseError(versionMismatchError);

const bulkActionEntryErrorResponse = bulkActionResponseError(validationFailedError);

const bulkActionServerErrorResponse = bulkActionResponseError(serverError);

export {
  publishBulkActionSuccessResponse,
  validateBulkActionSuccessResponse,
  bulkActionVersionMismatchErrorResponse,
  bulkActionEntryErrorResponse,
  bulkActionServerErrorResponse,
  serverError,
};
