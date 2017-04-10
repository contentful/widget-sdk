import sinon from 'npm:sinon';

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
 * - `publishedCTs` Stubs all methods.
 *   TODO provide a mock implementation with space endpoint
 * - `editingInterfaces` Always returns default interface.
 * - `widgets` without custom extensions.
 * - `docPool.get` Creates mock document
 *
 * @usage[js]
 * const spaceContext = this.$inject('mocks/spaceContext').init();
 * this.$inject('spaceContext') === spaceContext
 * spaceContext.publishedCTs.fetch.resolves(ct)
 */
angular.module('contentful/mocks')
.factory('mocks/spaceContext', ['require', function (require) {
  const cfStub = require('cfStub');
  const createEIRepo = require('data/editingInterfaces');
  const Widgets = require('widgets');
  const MockDocument = require('mocks/entityEditor/Document');
  const createApiKeyRepo = require('data/CMA/ApiKeyRepo').default;
  const createMockEndpoint = require('mocks/spaceEndpoint').create;

  return {
    init: init
  };

  function init () {
    const spaceContext = sinon.stubAll(require('spaceContext'));

    const CTRepo = require('data/ContentTypeRepo/Published');
    spaceContext.publishedCTs = sinon.stubAll(CTRepo.create());

    const space = cfStub.space('test');
    spaceContext.space = sinon.stubAll(space);

    // We create a mock space endpoint that always returns a 404. This
    // makes the EI repo create an editing interface from scratch.
    const eiSpaceEndpoint = sinon.stub().rejects({status: 404});
    spaceContext.editingInterfaces = createEIRepo(eiSpaceEndpoint);

    Widgets.setSpace({
      endpoint: sinon.stub().returns({
        get: sinon.stub().resolves({items: []})
      })
    });
    spaceContext.widgets = Widgets;

    spaceContext.docPool = {
      get: function (entity, _contentType) {
        return MockDocument.create(entity.data);
      }
    };

    spaceContext.endpoint = createMockEndpoint();
    spaceContext.apiKeyRepo = createApiKeyRepo(spaceContext.endpoint);
    spaceContext.organizationContext = {};

    return spaceContext;
  }
}]);
