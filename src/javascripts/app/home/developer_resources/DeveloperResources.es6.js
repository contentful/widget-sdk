import environment from 'environment';

const MARKETING_BASE_URL = environment.settings.marketingUrl;

export const developerResources = {
  'JavaScript': {
    examples: [
      {
        name: 'Discovery app',
        url: 'https://github.com/contentful/discovery-app-react',
        description: 'This GitHub project is a React based application for you to explore your spaces and their content.'
      },
      {
        name: 'Product catalogue',
        url: 'https://www.contentful.com/developers/docs/javascript/tutorials/create-expressjs-app-using-contentful/',
        description: 'Learn how to create a web app with Contentful and Express.js.'
      },
      {
        name: 'Image gallery',
        url: 'https://github.com/contentful/gallery-app-react',
        description: 'This GitHub project is a React based gallery application for you to explore.'
      }
    ],
    links: [
      {name: 'Overview', url: 'https://www.contentful.com/developers/docs/javascript/'},
      {name: 'Getting started', url: 'https://www.contentful.com/developers/docs/javascript/tutorials/using-js-cda-sdk/'},
      {name: 'Tutorials', url: 'https://www.contentful.com/developers/docs/javascript/#tutorials'},
      {name: 'Example apps', url: 'https://www.contentful.com/developers/docs/javascript/#example-apps'}
    ]
  },
  'PHP': {
    examples: [
      {
        name: 'Symfony',
        url: 'https://www.contentful.com/developers/docs/php/tutorials/getting-started-with-contentful-and-symfony/',
        description: 'Learn how to use Contentful in your Symfony based applications.'
      },
      {
        name: 'Laravel',
        url: 'https://www.contentful.com/developers/docs/php/tutorials/getting-started-with-contentful-and-laravel/',
        description: 'Learn how to use Contentful in your Laravel based applications.'
      }
    ],
    links: [
      {name: 'Overview', url: 'https://www.contentful.com/developers/docs/php/'},
      {name: 'Getting started', url: 'https://www.contentful.com/developers/docs/php/tutorials/getting-started-with-contentful-and-php/'},
      {name: 'Tutorials', url: 'https://www.contentful.com/developers/docs/php/#tutorials'},
      {name: 'Example apps', url: 'https://www.contentful.com/developers/docs/php/#example-apps'}
    ]
  },
  '.NET': {
    examples: [],
    links: [
      {name: 'Overview', url: 'https://www.contentful.com/developers/docs/net/'},
      {name: 'Getting started', url: 'https://www.contentful.com/developers/docs/net/tutorials/using-net-cda-sdk/'},
      {name: 'Tutorials', url: 'https://www.contentful.com/developers/docs/net/#tutorials'}
    ]
  },
  'Ruby': {
    examples: [
      {
        name: 'Ruby on Rails',
        url: 'https://www.contentful.com/developers/docs/ruby/tutorials/create-your-own-rails-app/',
        description: 'Learn how to use Contentful in a Rails based application.'
      },
      {
        name: 'Product catalogue',
        url: 'https://github.com/contentful/contentful_rails_tutorial',
        description: 'Explore this GitHub repository to learn how to make a product catalogue style application.'
      }
    ],
    links: [
      {name: 'Overview', url: 'https://www.contentful.com/developers/docs/ruby/'},
      {name: 'Getting started', url: 'https://www.contentful.com/developers/docs/ruby/tutorials/getting-started-with-contentful-and-ruby/'},
      {name: 'Tutorials', url: 'https://www.contentful.com/developers/docs/ruby/#tutorials'},
      {name: 'Example apps', url: 'https://www.contentful.com/developers/docs/ruby/#example-apps'}
    ]
  },
  'iOS': {
    examples: [
      {
        name: 'Swift app',
        url: 'https://www.contentful.com/developers/docs/ios/tutorials/using-delivery-api-with-swift/',
        description: 'Create your first Swift based app with Contentful'
      },
      {
        name: 'Apple Watch',
        url: 'https://github.com/contentful/ContentfulWatchKitExample',
        description: 'Explore this GitHub repository to learn how to use Contentful with Apple Watch.'
      },
      {
        name: 'tvOS',
        url: 'https://github.com/contentful/tvful',
        description: 'Explore this GitHub repository to learn how to use Contentful with Apple TV.'
      }
    ],
    links: [
      {name: 'Overview', url: 'https://www.contentful.com/developers/docs/ios/'},
      {name: 'Getting started', url: 'https://www.contentful.com/developers/docs/ios/tutorials/using-delivery-api-with-swift/'},
      {name: 'Tutorials', url: 'https://www.contentful.com/developers/docs/ios/#tutorials'},
      {name: 'Example apps', url: 'https://www.contentful.com/developers/docs/ios/#example-apps'}
    ]
  },
  'Android': {
    examples: [
      {
        name: 'Discovery app',
        url: 'https://github.com/contentful/discovery-app-android',
        description: 'Explore this GitHub repository to learn how to make an app that helps you explore spaces and their content'
      },
      {
        name: 'A blog app',
        url: 'https://github.com/contentful/blog-app-android',
        description: 'Explore this GitHub repository to learn how to make a blog style app.'
      },
      {
        name: 'A gallery app',
        url: 'https://github.com/contentful/gallery-app-android',
        description: 'Explore this GitHub repository to learn how to make a gallery style app.'
      },
      {
        name: 'Google cardboard',
        url: 'https://github.com/contentful-labs/contentful-cardboard',
        description: 'This GitHub project shows you how to create a VR app with Contentful.'
      }
    ],
    links: [
      {name: 'Overview', url: 'https://www.contentful.com/developers/docs/android/'},
      {name: 'Getting started', url: 'https://www.contentful.com/developers/docs/android/tutorials/getting-started-with-contentful-and-android/'},
      {name: 'Tutorials', url: 'https://www.contentful.com/developers/docs/android/#tutorials'},
      {name: 'Example apps', url: 'https://www.contentful.com/developers/docs/android/#example-apps'}
    ]
  },
  'Java': {
    examples: [],
    links: [
      {name: 'Overview', url: 'https://www.contentful.com/developers/docs/java/'},
      {name: 'Tutorials', url: 'https://www.contentful.com/developers/docs/java/tutorials/'}
    ]
  },
  'Python': {
    examples: [
      {
        name: 'Django',
        url: 'https://github.com/contentful/contentful_django_tutorial',
        description: 'This GitHub project shows you how to create a Django app with Contentful.'
      }
    ],
    links: [
      {name: 'Overview', url: 'https://www.contentful.com/developers/docs/python/'},
      {name: 'Getting started', url: 'https://www.contentful.com/developers/docs/python/tutorials/getting-started-with-contentful-and-python/'},
      {name: 'Tutorials', url: 'https://www.contentful.com/developers/docs/python/#tutorials'}
    ]
  }
};

export const apiDocsUrls = [
  {name: 'Content Delivery API', url: makeDocsUrl('content-delivery-api')},
  {name: 'Images API', url: makeDocsUrl('images-api')},
  {name: 'Content Management API', url: makeDocsUrl('content-management-api')},
  {name: 'Content Preview API', url: makeDocsUrl('content-preview-api')},
  {name: 'Sync API', url: makeDocsUrl('content-delivery-api/#/reference/synchronization')}
];

function makeDocsUrl (path) {
  return MARKETING_BASE_URL + '/developers/docs/references/' + path;
}
