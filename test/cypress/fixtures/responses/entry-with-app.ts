import { defaultUserId, defaultSpaceId } from '../../util/requests';

export const entryWithApp = {
  sys: {
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: defaultSpaceId,
      },
    },
    id: 'entryIdWithApp',
    type: 'Entry',
    createdAt: '2020-07-08T08:54:45.538Z',
    updatedAt: '2020-07-08T09:56:23.239Z',
    environment: {
      sys: {
        id: 'master',
        type: 'Link',
        linkType: 'Environment',
      },
    },
    createdBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: defaultUserId,
      },
    },
    updatedBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: defaultUserId,
      },
    },
    publishedCounter: 0,
    version: 2,
    contentType: {
      sys: {
        type: 'Link',
        linkType: 'ContentType',
        id: 'dropboxTest',
      },
    },
  },
  fields: {
    fieldID: {
      'en-US': 'Test App',
    },
  },
};
