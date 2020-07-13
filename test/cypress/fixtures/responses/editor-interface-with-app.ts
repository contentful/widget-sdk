import { defaultSpaceId, defaultUserId } from '../../util/requests';

export const editorInterfaceResponseWithApp = {
  sys: {
    id: 'dropboxTest',
    type: 'EditorInterface',
    space: {
      sys: {
        id: defaultSpaceId,
        type: 'Link',
        linkType: 'Space',
      },
    },
    version: 3,
    createdAt: '2020-07-08T08:54:19.330Z',
    createdBy: {
      sys: {
        id: defaultUserId,
        type: 'Link',
        linkType: 'User',
      },
    },
    updatedAt: '2020-07-08T08:54:36.402Z',
    updatedBy: {
      sys: {
        id: defaultUserId,
        type: 'Link',
        linkType: 'User',
      },
    },
    contentType: {
      sys: {
        id: 'dropboxTest',
        type: 'Link',
        linkType: 'ContentType',
      },
    },
    environment: {
      sys: {
        id: 'master',
        type: 'Link',
        linkType: 'Environment',
      },
    },
  },
  controls: [
    {
      fieldId: 'title',
      widgetId: 'singleLine',
      widgetNamespace: 'builtin',
    },
    {
      fieldId: 'dropboxApp',
      widgetId: '6YdAwxoPHopeTeuwh43UJu',
      widgetNamespace: 'app',
    },
  ],
};
