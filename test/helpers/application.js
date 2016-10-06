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
      base_host: 'be.test.com',
      api_host: 'api.test.com',
      asset_host: 'static.test.com',
      ot_host: 'ot.test.com',
      marketing_url: '//www.test.com',
      main_domain: 'test.com'
    },
    manifest: {
      'app/markdown_vendors.js': 'x',
      'app/kaltura.js': 'x'
    },
    env: 'unittest'
  });
}]);
