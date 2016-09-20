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

.constant('environment', (function () {
  return {
    settings: {
      main_domain: 'contentful.com',
      filepicker: {},
      aviary: {},
      google: {},
      contentful: {},
      marketing_url: '//example.com'
    },
    manifest: {
      'app/markdown_vendors.js': 'x',
      'app/kaltura.js': 'x'
    },
    isDev: false,
    env: 'unittest'
  };
})());
