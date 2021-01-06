import { defaultUserId, defaultSpaceId } from '../../../util/requests';

export const appInstallationsMarketPlace = {
  sys: { type: 'Array' },
  total: 1,
  skip: 0,
  limit: 100,
  items: [
    {
      sys: {
        type: 'AppInstallation',
        createdBy: { sys: { id: defaultUserId, type: 'Link', linkType: 'User' } },
        updatedBy: { sys: { id: defaultUserId, type: 'Link', linkType: 'User' } },
        createdAt: '2020-07-07T08:17:22.318Z',
        updatedAt: '2020-07-07T08:17:22.318Z',
        appDefinition: {
          sys: { type: 'Link', linkType: 'AppDefinition', id: '6YdAwxoPHopeTeuwh43UJu' },
        },
        space: { sys: { type: 'Link', linkType: 'Space', id: defaultSpaceId } },
        environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
      },
      parameters: {},
    },
    {
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
    },
  ],
  includes: {
    AppDefinition: [
      {
        sys: {
          id: '6YdAwxoPHopeTeuwh43UJu',
          type: 'AppDefinition',
          organization: {
            sys: { type: 'Link', linkType: 'Organization', id: '5EJGHo8tYJcjnEhYWDxivp' },
          },
          createdAt: '2019-11-13T15:12:53.401Z',
          updatedAt: '2020-04-27T12:27:27.098Z',
          createdBy: { sys: { type: 'Link', linkType: 'User', id: '46JHc8ru6cDDm0CtthS0Kw' } },
          updatedBy: { sys: { type: 'Link', linkType: 'User', id: '5NItczv8FWvPn5UTJpTOMM' } },
        },
        name: 'Dropbox',
        src: 'https://dropbox.ctfapps.net',
        locations: [
          { location: 'app-config' },
          { location: 'entry-field', fieldTypes: [{ type: 'Object' }] },
        ],
      },
      {
        sys: {
          id: 'abcAwxoPHopeTeuwh43UJu',
          type: 'AppDefinition',
          organization: {
            sys: { type: 'Link', linkType: 'Organization', id: '5EJGHo8tYJcjnEhYWDxivp' },
          },
          createdAt: '2019-11-13T15:12:53.401Z',
          updatedAt: '2020-04-27T12:27:27.098Z',
          createdBy: { sys: { type: 'Link', linkType: 'User', id: '46JHc8ru6cDDm0CtthS0Kw' } },
          updatedBy: { sys: { type: 'Link', linkType: 'User', id: '5NItczv8FWvPn5UTJpTOMM' } },
        },
        name: 'Private about without config',
        locations: [],
      },
    ],
  },
};
