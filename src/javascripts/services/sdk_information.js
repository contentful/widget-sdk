'use strict';

/**
 * @ngdoc service
 * @name sdkInfoProvider
 * @description
 * Provides information about SDKs and language specific libraries
 */
angular.module('contentful')
.factory('sdkInfoProvider', function () {

  var languageData = [
    {
      id: 'js',
      name: 'JavaScript',
      icon: 'language-js',
      data: {
        documentation: {
          name: 'Documentation',
          icon: 'learn-documentation',
          description: 'SDKs, tutorials, integrations and example applications will help you get started with Contentful and JavaScript.',
          links: [
            {
              text: 'Read the documentation',
              url: 'https://www.contentful.com/developers/docs/javascript/'
            }
          ]
        },
        apidemo: {
          name: 'API Demo',
          icon: 'learn-api_demo',
          description: 'This guide shows how to make a call to the Contentful API with JavaScript, using some example content we’ve prepared.',
          links: [
            {
              text: 'View the API demo',
              url: 'https://www.contentful.com/developers/api-demo/javascript/'
            }
          ]
        },
        gettingStarted: {
          name: 'Getting started guide',
          icon: 'learn-getting-started',
          description: 'This tutorial will walk you through your first steps in using Contentful within your JavaScript application.',
          links: [
            {
              text: 'Read the guide',
              url: 'https://www.contentful.com/developers/docs/javascript/tutorials/using-js-cda-sdk/'
            }
          ]
        },
        deliveryApi: {
          name: 'SDK for Delivery API',
          icon: 'learn-github',
          description: 'Get the JavaScript SDK for Contentful’s Delivery API (CDA) directly from GitHub to get started delivering content.',
          links: [
            {
              text: 'Get the SDK',
              url: 'https://github.com/contentful/contentful.js'
            }
          ]
        }
      },
    },
    {
      id: 'php',
      name: 'PHP',
      icon: 'language-php',
      data: {
        documentation: {
          name: 'Documentation',
          icon: 'learn-documentation',
          description: 'SDKs, tutorials, integrations and example applications will help you get started with Contentful and PHP.',
          links: [
            {
              text: 'Read the documentation',
              url: 'https://www.contentful.com/developers/docs/php/'
            }
          ]
        },
        apidemo: {
          name: 'API Demo',
          icon: 'learn-api_demo',
          description: 'This guide shows how to make a call to the Contentful API with PHP, using some example content we’ve prepared.',
          links: [
            {
              text: 'View the API demo',
              url: 'https://www.contentful.com/developers/api-demo/php/'
            }
          ]
        },
        gettingStarted: {
          name: 'Getting started guide',
          icon: 'learn-getting-started',
          description: 'This tutorial will walk you through your first steps in using Contentful within your PHP application.',
          links: [
            {
              text: 'Read the guide',
              url: 'https://www.contentful.com/developers/docs/php/tutorials/getting-started-with-contentful-and-php/'
            }
          ]
        },
        deliveryApi: {
          name: 'SDK for Delivery API',
          icon: 'learn-github',
          description: 'Get the PHP SDK for Contentful’s Delivery API (CDA) directly from GitHub to get started delivering content.',
          links: [
            {
              text: 'Get the SDK',
              url: 'https://github.com/contentful/contentful.php'
            }
          ]
        }
      }
    },
    {
      id: 'ruby',
      name: 'Ruby',
      icon: 'language-ruby',
      data: {
        documentation: {
          name: 'Documentation',
          icon: 'learn-documentation',
          description: 'SDKs, tutorials, integrations and example applications will help you get started with Contentful and Ruby.',
          links: [
            {
              text: 'Read the documentation',
              url: 'https://www.contentful.com/developers/docs/ruby/'
            }
          ]
        },
        apidemo: {
          name: 'API Demo',
          icon: 'learn-api_demo',
          description: 'This guide shows how to make a call to the Contentful API with Ruby, using some example content we’ve prepared.',
          links: [
            {
              text: 'View the API demo',
              url: 'https://www.contentful.com/developers/api-demo/ruby/'
            }
          ]
        },
        gettingStarted: {
          name: 'Getting started guide',
          icon: 'learn-getting-started',
          description: 'This tutorial will walk you through your first steps in using Contentful within your Ruby application.',
          links: [
            {
              text: 'Read the guide',
              url: 'https://www.contentful.com/developers/docs/ruby/tutorials/getting-started-with-contentful-and-ruby/'
            }
          ]
        },
        deliveryApi: {
          name: 'SDK for Delivery API',
          icon: 'learn-github',
          description: 'Get the Ruby SDK for Contentful’s Delivery API (CDA) directly from GitHub to get started delivering content.',
          links: [
            {
              text: 'Get the SDK',
              url: 'https://github.com/contentful/contentful.rb'
            }
          ]
        }
      }
    },
    {
      id: 'ios',
      name: 'iOS',
      icon: 'language-ios',
      data: {
        documentation: {
          name: 'Documentation',
          icon: 'learn-documentation',
          description: 'SDKs, tutorials, integrations and example applications will help you get started with Contentful and iOS.',
          links: [
            {
              text: 'Read the documentation',
              url: 'https://www.contentful.com/developers/docs/ios/'
            }
          ]
        },
        apidemo: {
          name: 'API Demo',
          icon: 'learn-api_demo',
          description: 'This guide shows how to make a call to the Contentful API with iOS, using some example content we’ve prepared.',
          links: [
            {
              text: 'View the API demo',
              url: 'https://www.contentful.com/developers/api-demo/swift/'
            }
          ]
        },
        gettingStarted: {
          name: 'Getting started guide',
          icon: 'learn-getting-started',
          description: 'This tutorial will walk you through your first steps in using Contentful within your iOS application.',
          links: [
            {
              text: 'Read the guide',
              url: 'https://www.contentful.com/developers/docs/ios/tutorials/using-delivery-api-on-ios/'
            }
          ]
        },
        deliveryApi: {
          name: 'SDK for Delivery API',
          icon: 'learn-github',
          description: 'Get the Ruby SDK for Contentful’s Delivery API (CDA) directly from GitHub to get started delivering content.',
          links: [
            {
              text: 'Swift SDK',
              url: 'https://github.com/contentful/contentful.swift'
            },
            {
              text: 'Objective-C SDK',
              url: 'https://github.com/contentful/contentful.objc'
            }
          ]
        }
      }
    },
    {
      id: 'android',
      name: 'Android',
      icon: 'language-android',
      data: {
        documentation: {
          name: 'Documentation',
          icon: 'learn-documentation',
          description: 'SDKs, tutorials, integrations and example applications will help you get started with Contentful and Android.',
          links: [
            {
              text: 'Read the documentation',
              url: 'https://www.contentful.com/developers/docs/android/'
            }
          ]
        },
        apidemo: {
          name: 'API Demo',
          icon: 'learn-api_demo',
          description: 'This guide shows how to make a call to the Contentful API with Java, using some example content we’ve prepared.',
          links: [
            {
              text: 'View the API demo',
              url: 'https://www.contentful.com/developers/api-demo/java/'
            }
          ]
        },
        gettingStarted: {
          name: 'Getting started guide',
          icon: 'learn-getting-started',
          description: 'This tutorial will walk you through your first steps in using Contentful within your Android application.',
          links: [
            {
              text: 'Read the guide',
              url: 'https://www.contentful.com/developers/docs/android/tutorials/getting-started-with-contentful-and-android/'
            }
          ]
        },
        deliveryApi: {
          name: 'SDK for Delivery API',
          icon: 'learn-github',
          description: 'Get the Java SDK for Contentful’s Delivery API (CDA) directly from GitHub to get started delivering content.',
          links: [
            {
              text: 'Get the SDK',
              url: 'https://github.com/contentful/contentful.java'
            }
          ]
        }
      }
    },
    {
      id: 'http',
      name: 'HTTP',
      icon: 'language-http',
      data: {
        documentation: {
          name: 'Documentation',
          icon: 'learn-documentation',
          description: 'View the API reference',
          links: [
            {
              text: 'API Reference',
              url: 'https://www.contentful.com/developers/docs/#api-references'
            }
          ]
        },
        apidemo: {
          name: 'API Demo',
          icon: 'learn-api_demo',
          description: 'This guide shows how to make a call to the Contentful API with cURL, using some example content we’ve prepared.',
          links: [
            {
              text: 'View the API demo',
              url: 'https://www.contentful.com/developers/api-demo/curl/'
            }
          ]
        }
      }
    }
  ];

  return {
    /**
     * @ngdoc method
     * @name sdkInformation#get
     * @param {Array<string>}
     * @returns {Array}
     * Returns the list of languages with their `data` attribute filtered to
     * include only explicitly requested keys
     */
    get: function(keys) {
      return _.map(languageData, function(language) {
        language.data = _.partialRight(_.pick, keys)(language.data);
        return language;
      });
    }
  };

});
