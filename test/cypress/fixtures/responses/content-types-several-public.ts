import { defaultSpaceId, defaultUserId } from '../../util/requests';

export const severalPublicContentTypes = {
  sys: {
    type: 'Array',
  },
  total: 1,
  skip: 0,
  limit: 1000,
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: defaultSpaceId,
          },
        },
        id: 'testContentType',
        type: 'ContentType',
        createdAt: '2019-04-08T09:12:00.101Z',
        updatedAt: '2019-04-08T09:12:00.101Z',
        publishedBy: {
          sys: {
            linkType: 'User',
            type: 'Link',
            id: defaultUserId,
          },
        },
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        revision: 1,
      },
      displayField: 'fieldID',
      name: 'Test Content Type',
      description: '',
      fields: [
        {
          id: 'fieldID',
          apiName: 'testFieldName',
          name: 'Test field name',
          type: 'Symbol',
          localized: false,
          required: false,
          validations: [],
          disabled: false,
          omitted: false,
        },
      ],
    },
    {
      name: 'Dropbox Test',
      description: '',
      displayField: 'title',
      fields: [
        {
          id: 'title',
          name: 'Title',
          type: 'Symbol',
          localized: false,
          required: false,
          validations: [],
          disabled: false,
          omitted: false,
        },
        {
          id: 'dropboxApp',
          name: 'Dropbox App',
          type: 'Object',
          localized: false,
          required: false,
          validations: [],
          disabled: false,
          omitted: false,
        },
      ],
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: defaultSpaceId,
          },
        },
        id: 'dropboxTest',
        type: 'ContentType',
        createdAt: '2020-07-08T08:54:18.523Z',
        updatedAt: '2020-07-08T08:54:19.210Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        publishedVersion: 1,
        publishedAt: '2020-07-08T08:54:19.210Z',
        firstPublishedAt: '2020-07-08T08:54:19.210Z',
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
        publishedCounter: 1,
        version: 2,
        publishedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: defaultUserId,
          },
        },
      },
    },
  ],
};
