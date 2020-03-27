import sinon from 'sinon';
import { stubAll } from 'test/utils/sinon';
import createMockEndpoint from 'test/utils/createSpaceEndpointMock';
import APIClient from 'data/APIClient';
import * as CTRepo from 'data/ContentTypeRepo/Published';

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
  'mocks/entityEditor/Document',
  (spaceContext, cfStub, { create: createDocument }) => {
    return {
      init: init,
    };

    function init() {
      const spaceContextMock = stubAll(spaceContext);

      spaceContextMock.publishedCTs = stubAll(CTRepo.create());

      const space = cfStub.space('test');
      space.environmentMeta = {};
      space.environment = { sys: { id: 'testEnv' } };
      spaceContextMock.space = stubAll(space);

      spaceContextMock.docPool = {
        get: function (entity, _contentType) {
          return createDocument(entity.data);
        },
      };

      spaceContextMock.memberships = createMembershipsMock();
      spaceContextMock.users = createUsersMock();

      spaceContextMock._mockEndpoint = createMockEndpoint();
      spaceContextMock.endpoint = spaceContextMock._mockEndpoint.request;
      spaceContextMock.cma = new APIClient(spaceContextMock.endpoint);
      spaceContextMock.organization = {
        subscriptionPlan: {
          limits: {},
        },
        usage: {},
        sys: {},
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
        remove: sinon.stub().resolves(),
      };
    }

    function createUiConfigMock() {
      const noop = () => {};
      const emptyArr = () => [];
      const canEdit = { views: true, folders: true };
      const scopedApi = { get: emptyArr, set: noop, getDefaults: emptyArr, canEdit };

      return Promise.resolve({
        entries: { shared: scopedApi, private: scopedApi },
        assets: { shared: scopedApi, private: scopedApi },
      });
    }

    function createUsersMock() {
      return {
        getAll: sinon.stub().resolves([]),
        get: sinon.stub().resolves(),
      };
    }
  },
]);
