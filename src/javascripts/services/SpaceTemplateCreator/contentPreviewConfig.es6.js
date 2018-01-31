// this is a common application for content preview
// it is used for `product catalogue`, `photo gallery` and `blog`.
// `the example space` uses it's own content preview app, built
// specifically for it
export const DISCOVERY_APP_BASE_URL = 'https://discovery.contentful.com/entries/by-content-type/';

// we want to have this content preview as the first option for TEA space
// it means that this content preview is guaranteed to be created first,
// and in the list of content previews it will be on the first place
export const TEA_MAIN_CONTENT_PREVIEW = {
  name: 'Node.js platform example',
  description: 'The example app, implemented in Node.js',
  baseUrl: {
    prod: 'https://the-example-app-nodejs.contentful.com',
    staging: 'https://the-example-app-nodejs.flinkly.com'
  }
};

// we want to create several content previews for TEA, one for each platform
// combining with main content preview will make code less readable
export const TEA_CONTENT_PREVIEWS = [
  {
    name: '.NET platform example',
    description: 'The example app, implemented in .NET',
    baseUrl: {
      prod: 'https://the-example-app-csharp.contentful.com',
      staging: 'https://the-example-app-csharp.flinkly.com'
    }
  },
  {
    name: 'Ruby platform example',
    description: 'The example app, implemented in Ruby using Sinatra',
    baseUrl: {
      prod: 'https://the-example-app-rb.contentful.com',
      staging: 'https://the-example-app-rb.flinkly.com'
    }
  },
  {
    name: 'PHP platform example',
    description: 'The example app, implemented in PHP',
    baseUrl: {
      prod: 'https://the-example-app-php.contentful.com',
      staging: 'https://the-example-app-php.flinkly.com'
    }
  },
  {
    name: 'Python platform example',
    description: 'The example app, implemented in Python using Flask',
    baseUrl: {
      prod: 'https://the-example-app-py.contentful.com',
      staging: 'https://the-example-app-py.flinkly.com'
    }
  }
];
