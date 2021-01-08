const testEntryId = 'testEntryId';

const makeVersionedLink = ({ type, id, version = 0 }) => ({
  sys: {
    id,
    version,
    linkType: type,
    type: 'Link',
  },
});

const versionedEntries = [
  makeVersionedLink({ type: 'Entry', id: testEntryId, version: 1 }),
  makeVersionedLink({ type: 'Entry', id: 'testEntryId1', version: 1 }),
  makeVersionedLink({ type: 'Asset', id: 'testAssetId', version: 1 }),
  makeVersionedLink({ type: 'Asset', id: 'testAssetId1', version: 1 }),
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
  error = {},
}: ResponseOptions) => {
  return {
    sys: {
      type: 'BulkAction',
      id: '95ukbnpkiYUlSNv3p0f2B',
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'my-space',
        },
      },
      environment: {
        sys: {
          type: 'Link',
          linkType: 'Environment',
          id: 'master',
        },
      },
      createdAt: '2020-12-15T17:12:43.215Z',
      updatedAt: '2020-12-15T17:12:43.531Z',
      startedAt: '2020-12-15T17:12:43.252Z',
      completedAt: status === 'succeeded' ? '2020-12-15T17:12:43.531Z' : null,
      createdBy: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: 'realUser123',
        },
      },
      status,
    },
    action,
    payload: {
      entities: {
        items: payload,
      },
    },
    error,
  };
};

const publishBulkActionSuccessResponse = bulkActionResponse({
  action: 'publish',
  status: 'succeeded',
});

const publishBulkActionErrorResponse = bulkActionResponse({
  status: 'failed',
  action: 'publish',
  error: versionMismatchError,
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
  versionMismatchError,
  serverError,
};
