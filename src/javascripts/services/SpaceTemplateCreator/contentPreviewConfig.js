// this is a common application for content preview
// it is used for `product catalogue`, `photo gallery` and `blog`.
// `the example space` uses it's own content preview app, built
// specifically for it
export const DISCOVERY_APP_BASE_URL = 'https://discovery.contentful.com/entries/by-content-type/';

// we want to have this content preview as the first option for TEA space
// it means that this content preview is guaranteed to be created first,
// and in the list of content previews it will be on the first place
export const TEA_MAIN_CONTENT_PREVIEW = {
  name: 'The Node.js example app',
  description: 'The preview setup for an example app built using Node.js',
  baseUrl: {
    prod: 'https://the-example-app-nodejs.contentful.com',
    staging: 'https://the-example-app-nodejs.flinkly.com',
  },
};

// we want to create several content previews for TEA, one for each platform
// combining with main content preview will make code less readable
export const TEA_CONTENT_PREVIEWS = [
  {
    name: 'The .NET example app',
    description: 'The preview setup for an example app built using .NET',
    baseUrl: {
      prod: 'https://the-example-app-csharp.contentful.com',
      staging: 'https://the-example-app-csharp.flinkly.com',
    },
  },
  {
    name: 'The Ruby example app',
    description: 'The preview setup for an example app built using Ruby and Sinatra',
    baseUrl: {
      prod: 'https://the-example-app-rb.contentful.com',
      staging: 'https://the-example-app-rb.flinkly.com',
    },
  },
  {
    name: 'The PHP example app',
    description: 'The preview setup for an example app built using PHP',
    baseUrl: {
      prod: 'https://the-example-app-php.contentful.com',
      staging: 'https://the-example-app-php.flinkly.com',
    },
  },
  {
    name: 'The Python example app',
    description: 'The preview setup for an example app built using Python and Flask',
    baseUrl: {
      prod: 'https://the-example-app-py.contentful.com',
      staging: 'https://the-example-app-py.flinkly.com',
    },
  },
  {
    name: 'The Java example app',
    description: 'The preview setup for an example app built using Java',
    baseUrl: {
      prod: 'https://the-example-app-java.contentful.com',
      staging: 'https://the-example-app-java.flinkly.com',
    },
  },
  // Swift(iOS) and Android have the same link because they lead to the page with QR-code that redirects to iOS and Android apps accordingly
  {
    name: 'The Swift example app',
    description: 'The preview setup for an example app built using Swift',
    baseUrl: {
      // Please be careful with the trailing slash – doc app specifically requires them
      // and if there is no trailing slash, it will add one, erasing all the query parameters
      prod: 'https://www.contentful.com/developers/the-example-app-mobile/',
      staging: 'https://www.flinkly.com/developers/the-example-app-mobile/',
    },
    isMobile: true,
  },
  {
    name: 'The Android example app',
    description: 'The preview setup for an example app built using Android',
    baseUrl: {
      prod: 'https://www.contentful.com/developers/the-example-app-mobile/',
      staging: 'https://www.flinkly.com/developers/the-example-app-mobile/',
    },
    isMobile: true,
  },
];
