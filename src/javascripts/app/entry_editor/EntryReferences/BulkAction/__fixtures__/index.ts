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
};

type ResponseOptions = {
  action: 'publish';
  payload?: object;
  status: 'created' | 'inProgress' | 'succeeded' | 'failed';
  error?: object;
};

const bulkActionResponse = ({
  action = 'publish',
  status = 'created',
  payload = versionedEntries,
  error,
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
    payload: {
      entities: {
        items: payload,
      },
    },
  };

  if (error) {
    response['error'] = error;
  }

  return response as BulkAction;
};

const publishBulkActionSuccessResponse = bulkActionResponse({
  status: 'succeeded',
  action: 'publish',
});

const publishBulkActionErrorResponse = bulkActionResponse({
  status: 'failed',
  action: 'publish',
  error: versionMismatchError,
});

const publishBulkActionEntryErrorResponse = bulkActionResponse({
  status: 'failed',
  action: 'publish',
  error: validationFailedError,
});

const publishBulkActionServerErrorResponse = bulkActionResponse({
  status: 'failed',
  action: 'publish',
  error: serverError,
});

export {
  publishBulkActionSuccessResponse,
  publishBulkActionErrorResponse,
  publishBulkActionServerErrorResponse,
  publishBulkActionEntryErrorResponse,
  versionMismatchError,
  serverError,
};
