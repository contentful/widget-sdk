import { MarketplaceApp } from 'features/apps-core';

export const apps: MarketplaceApp[] = [
  {
    title: 'Netlify',
    isListed: true,
    id: 'netlify',
    author: {
      name: 'Contentful',
      url: 'https://www.contentful.com/',
      icon:
        '//images.ctfassets.net/lpjm8d10rkpy/4DxiiBjixHZVjc69WpJX95/4708b0bdc8e713faf69a667f8266d190/472182',
    },
    categories: ['Featured', 'Deployment & Delivery'],
    description:
      "### About the app\n\nThe Netlify app makes creating and updating content on your site easier. The app removes the need to navigate between platforms, giving editors full control of everything from previewing to deploying changes. Content writers and editors can trigger Netlify builds with one click in the sidebar. \n\nSee build status in real-time, track progress and view recent changes all from within the web app. \n\n---\n\n### What you can do with the Netlify app: \n\n- Trigger Netlify builds with one click in the sidebar\n- Display build status so editors don't preview outdated sites\n- Bring Netlify functionality into the Contentful web app\n- Configure on a per-content-type level \n\n### Requirements:\n\n- A static site based on a static site generator such as Gatsby, Middleman or Hugo\n- Your site configured to load content from Contentful and its code pushed to a remote repository, such as GitHub or Gitlab\n- A Netlify setup where the site is connected to the remote repository and enabled for continuous deployment\n\n---\n\n### Screenshots\n\n![Netlify config](//images.ctfassets.net/lpjm8d10rkpy/4Rf8yoGPw4AQwdMboiVwhF/a0a9a8b8e73a5ace1fdf78adebc24a49/apps-netlify-site-setup.b4a24a69c0.png)\n\n![Netlify sidebar](//images.ctfassets.net/lpjm8d10rkpy/RrSqXTcdlpfkPt7sJzkEb/52de9067736f37aaf4d178b5b4367a69/apps-netlify-sidebar.png) \n",
    icon:
      '//images.ctfassets.net/lpjm8d10rkpy/2dYQ3x6VMNZJgDXYmMzLBx/b338ad4b50cd0ff31e7157671b801b4d/logomark.svg',
    documentationLink: {
      title: 'Documentation for the Netlify app',
      shortTitle: 'Documentation',
      url: 'https://www.contentful.com/developers/docs/extensibility/apps/netlify/',
    },
    links: [
      {
        title: 'Netlify Docs',
        shortTitle: 'Documentation',
        url: 'https://www.netlify.com/docs/',
      },
      {
        title: 'Documentation for the Netlify app',
        shortTitle: 'Documentation',
        url: 'https://www.contentful.com/developers/docs/extensibility/apps/netlify/',
      },
      {
        title: 'Netlify app source code on GitHub',
        shortTitle: 'Source code',
        url: 'https://github.com/contentful/apps/tree/master/apps/netlify',
      },
    ],
    supportUrl: 'https://www.contentful.com/support/',
    legal: {
      eula: 'https://github.com/contentful/apps/blob/master/apps/netlify/LICENSE',
      privacyPolicy: 'https://www.contentful.com/legal/us/privacy/',
    },
    tagLine: 'Easily build and preview sites with the Netlify app ',
    actionList: [
      {
        negative: true,
        info: 'Build widget will be removed from sidebars of all content types',
      },
      {
        negative: false,
        info:
          'This will not modify your Netlify sites. You may want to remove unneeded deploy notifications and build hooks from your Netlify site.',
      },
    ],
    featureFlagName: null,
    isEarlyAccess: false,
    appDefinition: {
      sys: {
        id: '1VchawWvbIClHuMIyxwR5m',
        type: 'AppDefinition',
        organization: {
          sys: {
            type: 'Link',
            linkType: 'Organization',
            id: '5EJGHo8tYJcjnEhYWDxivp',
          },
        },
        createdAt: '2019-07-24T09:09:45.574Z',
        updatedAt: '2020-04-27T12:28:25.505Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '46JHc8ru6cDDm0CtthS0Kw',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '5NItczv8FWvPn5UTJpTOMM',
          },
        },
      },
      name: 'Netlify',
      src: 'https://netlify.ctfapps.net',
      locations: [
        {
          location: 'app-config',
        },
        {
          location: 'entry-sidebar',
        },
      ],
    },
  },

  {
    id: 'lYxeubuDDkM6jQfbOkLnU',
    title: 'Example Private App',
    appDefinition: {
      sys: {
        id: 'lYxeubuDDkM6jQfbOkLnU',
        type: 'AppDefinition',
        organization: {
          sys: {
            type: 'Link',
            linkType: 'Organization',
            id: '1BsQdMaXpF9C5qdddTKLI9',
          },
        },
        createdAt: '2020-04-23T15:42:55.221Z',
        updatedAt: '2020-04-23T18:56:32.591Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '29B6zorz8plUCN1auThiVH',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '29B6zorz8plUCN1auThiVH',
          },
        },
      },
      name: 'Example Private App',
      src: 'https://ai-image-tagging.ctfapps.net',
      locations: [
        {
          location: 'app-config',
        },
      ],
    },
    appInstallation: {
      sys: {
        id: '29B6zorz8plUCN1auThiVH',
        type: 'AppInstallation',
        createdBy: {
          sys: {
            id: '29B6zorz8plUCN1auThiVH',
            type: 'Link',
            linkType: 'User',
          },
        },
        updatedBy: {
          sys: {
            id: '29B6zorz8plUCN1auThiVH',
            type: 'Link',
            linkType: 'User',
          },
        },
        createdAt: '2020-04-23T16:42:00.360Z',
        updatedAt: '2020-04-23T16:42:00.360Z',
        appDefinition: {
          sys: {
            type: 'Link',
            linkType: 'AppDefinition',
            id: 'lYxeubuDDkM6jQfbOkLnU',
          },
        },
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: '6zsefpijez5t',
          },
        },
        environment: {
          sys: {
            type: 'Link',
            linkType: 'Environment',
            id: 'master',
          },
        },
      },
      parameters: {
        authToken: '',
        previewUrl: 'https://demo.comv',
        webhookUrl: '',
      },
    },
    isPrivateApp: true,
    isEarlyAccess: false,
  },
];

export const contentfulApps: MarketplaceApp[] = [
  {
    id: 'lYxeubuDDkM6jQfbOkLn2',
    title: 'Compose',
    targetUrl: 'https://app.contentful.com',
    appDefinition: {
      sys: {
        id: 'lYxeubuDDkM6jQfbOkLn2',
        type: 'AppDefinition',
        organization: {
          sys: {
            type: 'Link',
            linkType: 'Organization',
            id: '1BsQdMaXpF9C5qdddTKLI9',
          },
        },
        createdAt: '2020-04-23T15:42:55.221Z',
        updatedAt: '2020-04-23T18:56:32.591Z',
        createdBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '29B6zorz8plUCN1auThiVH',
          },
        },
        updatedBy: {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: '29B6zorz8plUCN1auThiVH',
          },
        },
      },
      name: 'Compose',
      src: '',
      locations: [],
    },
    appInstallation: {
      sys: {
        type: 'AppInstallation',
        createdBy: {
          sys: {
            id: '29B6zorz8plUCN1auThiVH',
            type: 'Link',
            linkType: 'User',
          },
        },
        updatedBy: {
          sys: {
            id: '29B6zorz8plUCN1auThiVH',
            type: 'Link',
            linkType: 'User',
          },
        },
        createdAt: '2020-04-23T16:42:00.360Z',
        updatedAt: '2020-04-23T16:42:00.360Z',
        appDefinition: {
          sys: {
            type: 'Link',
            linkType: 'AppDefinition',
            id: 'lYxeubuDDkM6jQfbOkLn2',
          },
        },
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: '6zsefpijez5t',
          },
        },
        environment: {
          sys: {
            type: 'Link',
            linkType: 'Environment',
            id: 'master',
          },
        },
      },
    },
    isPrivateApp: false,
    isEarlyAccess: false,
    isContentfulApp: true,
  },
];
