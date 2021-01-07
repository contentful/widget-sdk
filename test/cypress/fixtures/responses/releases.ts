import { Matchers } from '@pact-foundation/pact-web';
import { makeLink, ReleaseAction } from '@contentful/types';
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
    type: 'Release',
    id: defaultReleaseId,
    space: makeLink('Space', defaultSpaceId),
    environment: makeLink('Environment', defaultEnvironmentId),
    createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
    createdBy: makeLink('User', defaultUserId),
    updatedAt: Matchers.iso8601DateTimeWithMillis('2019-09-02T14:00:00.000Z'),
    version: Matchers.integer(1),
  },
});

export const releaseAction = (status: ReleaseAction['sys']['status']) => ({
  sys: {
    type: 'ReleaseAction',
    id: defaultReleaseActionId,
    space: makeLink('Space', defaultSpaceId),
    environment: makeLink('Environment', defaultEnvironmentId),
    release: makeLink('Release', defaultReleaseId),
    status,
    createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
    updatedAt: Matchers.iso8601DateTimeWithMillis('2019-09-02T14:00:00.000Z'),
    createdBy: makeLink('User', defaultUserId),
  },
  action: 'publish',
});

export const severalEntitiesReleaseResponse = () => ({
  title: 'Twentieth Release',
  entities: {
    sys: { type: 'Array' },
    items: [makeLink('Entry', defaultEntryId), makeLink('Asset', defaultAssetId)],
  },
  sys: {
    type: 'Release',
    id: defaultReleaseId,
    space: makeLink('Space', defaultSpaceId),
    environment: makeLink('Environment', defaultEnvironmentId),
    createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
    createdBy: makeLink('User', defaultUserId),
    updatedAt: Matchers.iso8601DateTimeWithMillis('2019-09-02T14:00:00.000Z'),
    lastAction: releaseAction('succeeded'),
    version: Matchers.integer(1),
  },
});

export const severalReleases = ({ defaultActioned = false } = {}) => ({
  sys: {
    type: 'Array',
  },
  items: [
    {
      sys: {
        type: 'Release',
        id: defaultReleaseId,
        space: makeLink('Space', defaultSpaceId),
        environment: makeLink('Environment', defaultEnvironmentId),
        createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
        createdBy: makeLink('User', defaultUserId),
        lastAction: defaultActioned ? makeLink('ReleaseAction', defaultReleaseActionId) : undefined,
        updatedAt: Matchers.iso8601DateTimeWithMillis('2019-09-02T14:00:00.000Z'),
        version: Matchers.integer(1),
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
        type: 'Release',
        id: 'releaseId2',
        space: makeLink('Space', defaultSpaceId),
        environment: makeLink('Environment', defaultEnvironmentId),
        createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
        createdBy: makeLink('User', defaultUserId),
        updatedAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
        version: Matchers.integer(1),
      },
      title: 'Second release',
      entities: {
        sys: {
          type: 'Array',
        },
        items: [makeLink('Entry', defaultEntryId)],
      },
    },
    {
      sys: {
        type: 'Release',
        id: 'releaseId3',
        space: makeLink('Space', defaultSpaceId),
        environment: makeLink('Environment', defaultEnvironmentId),
        createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
        createdBy: makeLink('User', defaultUserId),
        updatedAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
        version: Matchers.integer(1),
      },
      title: 'Third release',
      entities: {
        sys: {
          type: 'Array',
        },
        items: [makeLink('Entry', defaultEntryId), makeLink('Asset', defaultAssetId)],
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
    type: 'Release',
    id: defaultReleaseId,
    space: makeLink('Space', defaultSpaceId),
    environment: makeLink('Environment', defaultEnvironmentId),
    createdAt: Matchers.iso8601DateTimeWithMillis('2020-05-02T14:00:00.000Z'),
    createdBy: makeLink('User', defaultUserId),
    updatedAt: Matchers.iso8601DateTimeWithMillis('2019-09-02T14:00:00.000Z'),
    version: Matchers.integer(2), // Should be incremented
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
