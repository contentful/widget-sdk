import * as sinon from 'test/helpers/sinon';
import createMockEndpoint from 'test/helpers/mocks/SpaceEndpoint';

import { create as createWidgetStore } from 'widgets/WidgetStore.es6';

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
  'widgets/EditorInterfaceRepo.es6',
  'data/ApiClient',
  'data/ContentTypeRepo/Published.es6',
  'mocks/entityEditor/Document',
  'data/CMA/ApiKeyRepo.es6',
  (
    spaceContext,
    cfStub,
    { default: createEIRepo },
    CMAClient,
    CTRepo,
    { create: createDocument },
    { default: createApiKeyRepo }
  ) => {
    return {
      init: init
    };

    function init() {
      const spaceContextMock = sinon.stubAll(spaceContext);

      spaceContextMock.publishedCTs = sinon.stubAll(CTRepo.create());

      const space = cfStub.space('test');
      spaceContextMock.space = sinon.stubAll(space);

      // We create a mock space endpoint that always returns a 404. This
      // makes the EI repo create an editing interface from scratch.
      const eiSpaceEndpoint = sinon.stub().rejects({ status: 404 });
      spaceContextMock.editingInterfaces = createEIRepo(eiSpaceEndpoint);

      spaceContextMock.docPool = {
        get: function(entity, _contentType) {
          return createDocument(entity.data);
        }
      };

      spaceContextMock.memberships = createMembershipsMock();
      spaceContextMock.users = createUsersMock();

      spaceContextMock._mockEndpoint = createMockEndpoint();
      spaceContextMock.endpoint = spaceContextMock._mockEndpoint.request;
      spaceContextMock.cma = new CMAClient(spaceContextMock.endpoint);
      spaceContextMock.apiKeyRepo = createApiKeyRepo(spaceContextMock.endpoint);
      spaceContextMock.organization = {
        subscriptionPlan: {
          limits: {}
        },
        usage: {},
        sys: {}
      };
      spaceContextMock.widgets = createWidgetStore(spaceContextMock.cma);
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
