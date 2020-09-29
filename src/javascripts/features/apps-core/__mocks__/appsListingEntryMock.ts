export const appsListingEntryMock = {
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
        id: '2fPbSMx3baxlwZoCyXC7F1',
        type: 'Entry',
        createdAt: '2019-10-02T14:57:50.083Z',
        updatedAt: '2020-02-24T13:00:26.435Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        revision: 30,
        contentType: {
          sys: {
            type: 'Link',
            linkType: 'ContentType',
            id: 'appsListing',
          },
        },
        locale: 'en-US',
      },
      fields: {
        title: 'Apps Listing',
        apps: [
          {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: '5ZSCLEfnoPdTF3agzaGGRb',
            },
          },
          {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: '4iIetqcwsR1GIZxaYI6fRm',
            },
          },
        ],
      },
    },
  ],
};
