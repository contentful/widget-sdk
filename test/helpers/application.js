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

angular.module('contentful/test', ['contentful', 'contentful/mocks'])

.config(['$provide', 'environment', function ($provide) {
  // We cannot provide the environment as a constant directly because
  // changes to it would leak between tests.
  $provide.constant('environment', {
    settings: {
      filepicker: {},
      aviary: {},
      google: {},
      contentful: {},
      authUrl: '//be.test.com',
      apiUrl: '//api.test.com',
      otUrl: '//ot.test.com',
      assetUrl: '//static.test.com',
      marketingUrl: '//www.test.com',
      main_domain: 'test.com'
    },
    manifest: {
      'app/markdown_vendors.js': 'x',
      'app/kaltura.js': 'x'
    },
    env: 'unittest'
  });
}]);
