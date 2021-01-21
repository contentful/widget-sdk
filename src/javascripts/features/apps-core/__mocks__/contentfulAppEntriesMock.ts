export const contentfulAppEntriesMock = {
  sys: {
    type: 'Array',
  },
  total: 1,
  skip: 0,
  limit: 100,
  items: [
    {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'lpjm8d10rkpy',
          },
        },
        id: '5ZSCLEfnoPdTF3agzaGGRb',
        type: 'Entry',
        createdAt: '2019-08-09T11:39:29.930Z',
        updatedAt: '2020-02-24T10:31:10.573Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        revision: 49,
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'app',
          },
        },
        locale: 'en-US',
      },
      fields: {
        title: 'Compose',
        slug: 'compose',
        appDefinitionIDs: { production: '6TfQEqkcINtj1MS0TuQTWJ' },
        targetUrl: 'https://compose.contentful.com',
        icon: {
          sys: {
            type: 'Link',
            linkType: 'Asset',
            id: '4DxiiBjixHZVjc69WpJX95',
          },
        },
        developer: {
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: 'jN06evDcSVRSRoiXmXDf6',
          },
        },
        description: 'Placeholder description',
        tagLine: 'Easily create and edit content at scale in a completely new way.',
        featureFlagName: 'COMPOSE_APP_LISTING_EAP',
      },
    },
  ],
};
