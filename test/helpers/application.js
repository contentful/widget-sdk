'use strict';

/**
 * @ngdoc module
 * @name contentful/test
 *
 * @description
 * If this module is loaded it will provide extra methods to `sinon`
 * stubs.
 *
 * ~~~js
 * // Creates a function that returns a rejected promise
 * sinon.stub().rejects(new Error())
 * // Creates a function that returns a resolved promise
 * sinon.stub().resolves('hello')
 * ~~~
 *
 */

angular
  .module('contentful/test', ['contentful', 'contentful/mocks'])

  .config([
    '$provide',
    $provide => {
      // We cannot provide the environment as a constant directly because
      // changes to it would leak between tests.
      $provide.constant('Config.es6', {
        authUrl: x => `//be.test.com${ensureLeadingSlash(x)}`,
        apiUrl: x => `//api.test.com${ensureLeadingSlash(x)}`,
        websiteUrl: x => `//www.test.com${ensureLeadingSlash(x)}`,
        accountUrl: x => `//be.test.com/account${ensureLeadingSlash(x)}`,
        domain: 'test.com',
        env: 'unittest',
        launchDarkly: { envId: 'launch-darkly-test-id' },
        snowplow: {},
        services: {
          filestack: {},
          google: {},
          contentful: {}
        }
      });

      function ensureLeadingSlash(x = '') {
        if (x.charAt(0) === '/') {
          return x;
        } else {
          return '/' + x;
        }
      }
    }
  ]);
