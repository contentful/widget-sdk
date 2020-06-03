import { Matchers } from '@pact-foundation/pact-web';
import {
  defaultAssetId,
  defaultEntryId,
  defaultSpaceId,
  defaultUserId,
  defaultEnvironmentId,
  defaultReleaseId,
} from '../../util/requests';

export const noReleases = () => ({
  sys: {
    type: 'Array',
  },
  limit: 100,
  pages: {},
  items: [],
});

export const severalReleases = () => ({
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
