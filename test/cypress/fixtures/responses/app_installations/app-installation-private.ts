import { defaultSpaceId, defaultUserId } from '../../../util/requests';

export const privateAppInstallation = {
  sys: {
    type: 'AppInstallation',
    createdBy: { sys: { id: defaultUserId, type: 'Link', linkType: 'User' } },
    updatedBy: { sys: { id: defaultUserId, type: 'Link', linkType: 'User' } },
    createdAt: '2020-07-07T08:17:22.318Z',
    updatedAt: '2020-07-07T08:17:22.318Z',
    appDefinition: {
      sys: { type: 'Link', linkType: 'AppDefinition', id: 'abcAwxoPHopeTeuwh43UJu' },
    },
    space: { sys: { type: 'Link', linkType: 'Space', id: defaultSpaceId } },
    environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
  },
  parameters: {},
};
