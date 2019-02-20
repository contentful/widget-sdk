import * as sinon from 'test/helpers/sinon';
import createMockEndpoint from 'test/helpers/mocks/SpaceEndpoint';
import APIClient from 'data/APIClient.es6';

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
 * - `docPool.get` Creates mock document
 * - `memberships` Instance of 'access_control/SpaceMembershipRepository
 *
 * @usage[js]
 * const spaceContext = this.$inject('mocks/spaceContext').init();
 * this.$inject('spaceContext') === spaceContext
 * spaceContext.publishedCTs.fetch.resolves(ct)
 */
angular.module('contentful/mocks').factory('mocks/spaceContext', [
  'spaceContext',
  'cfStub',
  'data/ContentTypeRepo/Published.es6',
  'mocks/entityEditor/Document',
  'data/CMA/ApiKeyRepo.es6',
  (spaceContext, cfStub, CTRepo, { create: createDocument }, { default: createApiKeyRepo }) => {
    return {
      init: init
    };

    function init() {
      const spaceContextMock = sinon.stubAll(spaceContext);

      spaceContextMock.publishedCTs = sinon.stubAll(CTRepo.create());

      const space = cfStub.space('test');
      spaceContextMock.space = sinon.stubAll(space);

      spaceContextMock.docPool = {
        get: function(entity, _contentType) {
          return createDocument(entity.data);
        }
      };

      spaceContextMock.memberships = createMembershipsMock();
      spaceContextMock.users = createUsersMock();

      spaceContextMock._mockEndpoint = createMockEndpoint();
      spaceContextMock.endpoint = spaceContextMock._mockEndpoint.request;
      spaceContextMock.cma = new APIClient(spaceContextMock.endpoint);
      spaceContextMock.apiKeyRepo = createApiKeyRepo(spaceContextMock.endpoint);
      spaceContextMock.organization = {
        subscriptionPlan: {
          limits: {}
        },
        usage: {},
        sys: {}
      };
      spaceContextMock.uiConfig = createUiConfigMock();

      return spaceContextMock;
    }

    function createMembershipsMock() {
      return {
        getAll: sinon.stub().resolves([]),
        invite: sinon.stub().resolves(),
        inviteAdmin: sinon.stub().resolves(),
        changeRoleTo: sinon.stub().resolves(),
        changeRoleToAdmin: sinon.stub().resolves(),
        remove: sinon.stub().resolves()
      };
    }

    function createUiConfigMock() {
      const noop = () => {};
      const emptyArr = () => [];
      const canEdit = { views: true, folders: true };
      const scopedApi = { get: emptyArr, set: noop, getDefaults: emptyArr, canEdit };

      return {
        entries: { shared: scopedApi, private: scopedApi },
        assets: { shared: scopedApi, private: scopedApi }
      };
    }

    function createUsersMock() {
      return {
        getAll: sinon.stub().resolves([]),
        get: sinon.stub().resolves()
      };
    }
  }
]);
