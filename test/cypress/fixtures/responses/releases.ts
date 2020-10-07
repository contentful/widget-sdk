import { Matchers } from '@pact-foundation/pact-web';
import {
  defaultAssetId,
  defaultEntryId,
  defaultSpaceId,
  defaultUserId,
  defaultEnvironmentId,
  defaultReleaseId,
  defaultReleaseActionId,
} from '../../util/requests';

export const noReleases = () => ({
  sys: {
    type: 'Array',
  },
  limit: 100,
  pages: {},
  items: [],
});

export const emptyReleaseResponse = () => ({
  title: 'New Release',
  entities: {
    sys: { type: 'Array' },
    items: [],
  },
  sys: {
    createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
    createdBy: { sys: { id: defaultUserId, type: 'Link', linkType: 'User' } },
    space: { sys: { id: defaultSpaceId, type: 'Link', linkType: 'Space' } },
    environment: {
      sys: {
        id: defaultEnvironmentId,
        type: 'Link',
        linkType: 'Environment',
      },
    },
    id: defaultReleaseId,
    type: 'Release',
    updatedAt: Matchers.iso8601DateTimeWithMillis('2019-09-02T14:00:00.000Z'),
  },
});

export const severalEntitiesReleaseResponse = () => ({
  title: 'Twentieth Release',
  entities: {
    sys: { type: 'Array' },
    items: [
      { sys: { id: defaultEntryId, linkType: 'Entry', type: 'Link' } },
      { sys: { id: defaultAssetId, linkType: 'Asset', type: 'Link' } },
    ],
  },
  sys: {
    createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
    createdBy: { sys: { id: defaultUserId, type: 'Link', linkType: 'User' } },
    space: { sys: { id: defaultSpaceId, type: 'Link', linkType: 'Space' } },
    environment: {
      sys: {
        id: defaultEnvironmentId,
        type: 'Link',
        linkType: 'Environment',
      },
    },
    id: defaultReleaseId,
    type: 'Release',
    updatedAt: Matchers.iso8601DateTimeWithMillis('2019-09-02T14:00:00.000Z'),
  },
});

export const severalReleases = ({ defaultActioned = false } = {}) => ({
  sys: {
    type: 'Array',
  },
  items: [
    {
      sys: {
        createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
        createdBy: { sys: { id: defaultUserId, type: 'Link', linkType: 'User' } },
        space: { sys: { id: defaultSpaceId, type: 'Link', linkType: 'Space' } },
        environment: {
          sys: {
            id: defaultEnvironmentId,
            type: 'Link',
            linkType: 'Environment',
          },
        },
        id: defaultReleaseId,
        type: 'Release',
        lastAction: defaultActioned
          ? {
              sys: {
                type: 'Link',
                linkType: 'ReleaseAction',
                id: defaultReleaseActionId,
              },
            }
          : undefined,
        updatedAt: Matchers.iso8601DateTimeWithMillis('2019-09-02T14:00:00.000Z'),
      },
      title: 'First release',
      entities: {
        sys: {
          type: 'Array',
        },
        items: [],
      },
    },
    {
      sys: {
        createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
        createdBy: { sys: { id: defaultUserId, type: 'Link', linkType: 'User' } },
        space: { sys: { id: defaultSpaceId, type: 'Link', linkType: 'Space' } },
        environment: {
          sys: {
            id: defaultEnvironmentId,
            type: 'Link',
            linkType: 'Environment',
          },
        },
        id: 'releaseId2',
        type: 'Release',
        updatedAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
      },
      title: 'Second release',
      entities: {
        sys: {
          type: 'Array',
        },
        items: [
          {
            sys: { id: defaultEntryId, type: 'Link', linkType: 'Entry' },
          },
        ],
      },
    },
    {
      sys: {
        createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
        createdBy: { sys: { id: defaultUserId, type: 'Link', linkType: 'User' } },
        space: { sys: { id: defaultSpaceId, type: 'Link', linkType: 'Space' } },
        environment: {
          sys: {
            id: defaultEnvironmentId,
            type: 'Link',
            linkType: 'Environment',
          },
        },
        id: 'releaseId3',
        type: 'Release',
        updatedAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
      },
      title: 'Third release',
      entities: {
        sys: {
          type: 'Array',
        },
        items: [
          {
            sys: { id: defaultEntryId, type: 'Link', linkType: 'Entry' },
          },
          {
            sys: { id: defaultAssetId, type: 'Link', linkType: 'Asset' },
          },
        ],
      },
    },
  ],
  limit: 100,
  pages: {},
});

export const deleteEntityBodyResponse = () => ({
  title: 'Twentieth Release',
  entities: {
    items: [{ sys: { id: defaultAssetId, linkType: 'Asset', type: 'Link' } }],
  },
  sys: {
    createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
    createdBy: { sys: { id: defaultUserId, type: 'Link', linkType: 'User' } },
    space: { sys: { id: defaultSpaceId, type: 'Link', linkType: 'Space' } },
    environment: {
      sys: {
        id: defaultEnvironmentId,
        type: 'Link',
        linkType: 'Environment',
      },
    },
    id: defaultReleaseId,
    type: 'Release',
    updatedAt: Matchers.iso8601DateTimeWithMillis('2019-09-02T14:00:00.000Z'),
  },
});

export const validateBodyResponse = () => ({
  sys: {
    type: 'ReleaseValidation',
    id: 'ZaadqOy5t5HYKgU7lXNgE',
  },
  errored: [],
});

export const validateErrorResponse = () => ({
  sys: {
    type: 'ReleaseValidation',
    id: 'ZaadqOy5t5HYKgU7lXNgE',
  },
  errored: [
    {
      sys: {
        type: 'Link',
        linkType: 'Entry',
        id: defaultEntryId,
      },
      error: {
        sys: {
          type: 'Error',
          id: 'InvalidEntry',
        },
        message: 'Validation error',
        details: {
          errors: [
            {
              name: 'required',
              path: ['fields', 'title'],
              details: 'The property \title is required here',
            },
          ],
        },
      },
    },
  ],
});

export const publishValidationErrorResponse = () => ({
  sys: {
    type: 'Error',
    id: 'ValidationFailed',
  },
  message: 'Validation error',
  details: {
    errors: [
      {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: defaultEntryId,
        },
        error: {
          sys: {
            type: 'Error',
            id: 'InvalidEntry',
          },
          message: 'Validation error',
          details: {
            errors: [
              {
                name: 'required',
                path: ['fields', 'title'],
                details: 'The property \title is required here',
              },
            ],
          },
        },
      },
    ],
  },
});

export const releaseAction = (status) => ({
  sys: {
    type: 'ReleaseAction',
    id: defaultReleaseActionId,
    release: {
      sys: {
        type: 'Link',
        linkType: 'Release',
        id: defaultReleaseId,
      },
    },
    status: status,
    createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
    updatedAt: Matchers.iso8601DateTimeWithMillis('2019-09-02T14:00:00.000Z'),
    createdBy: { sys: { id: defaultUserId, type: 'Link', linkType: 'User' } },
    space: { sys: { id: defaultSpaceId, type: 'Link', linkType: 'Space' } },
    environment: {
      sys: {
        id: defaultEnvironmentId,
        type: 'Link',
        linkType: 'Environment',
      },
    },
  },
  action: 'publish',
});
