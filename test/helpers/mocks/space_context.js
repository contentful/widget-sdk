'use strict';

/**
 * @ngdoc service
 * @module contentful/mocks
 * @name mocks/spaceContext
 * @description
 * Creates a mock instance of an initialized space context, that is a space
 * context after calling `resetWithSpace()`.
 *
 * The mock space context has all methods stubbed and the following objects
 * replaced with stubs:
 * - `space`
 * - `publishedCTs`
 *
 * @usage[js]
 * const spaceContext = this.$inject('mocks/spaceContext').init();
 * this.$inject('spaceContext') === spaceContext
 * spaceContext.publishedCTs.fetch.resolves(ct)
 */
angular.module('contentful/mocks')
.factory('mocks/spaceContext', ['require', function (require) {
  const cfStub = require('cfStub');

  return {
    init: init
  };

  function init () {
    const spaceContext = sinon.stubAll(require('spaceContext'));

    const CTRepo = require('data/ContentTypeRepo/Published');
    spaceContext.publishedCTs = sinon.stubAll(CTRepo.create());

    const space = cfStub.space('test');
    spaceContext.space = sinon.stubAll(space);

    return spaceContext;
  }
}]);
