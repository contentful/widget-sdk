import _ from 'lodash';
import sinon from 'sinon';
import { $initialize, $inject, $apply } from 'test/helpers/helpers';
import { beforeEach, it } from 'test/helpers/dsl';

// TODO merge this with directive tests
describe('API Key List Controller', () => {
  let stubs = {};

  beforeEach(async function() {
    stubs = {
      apiErrorHandlerStub: sinon.stub()
    };

    this.resource = {
      usage: 0,
      limits: {
        included: 5,
        maximum: 10
      },
      sys: {
        id: 'api_keys',
        type: 'SpaceResource'
      }
    };

    this.system.set('services/ResourceService.es6', {
      default: () => {
        return {
          get: sinon.stub().resolves(this.resource)
        };
      }
    });
    this.system.set('app/common/ReloadNotification.es6', {
      default: {
        apiErrorHandler: stubs.apiErrorHandlerStub
      }
    });

    await $initialize(this.system);

    this.scope = {
      context: {}
    };

    this.getApiKeys = sinon.stub().resolves();
    this.spaceContext = _.extend($inject('spaceContext'), {
      getData: _.constant(2),
      space: { getOrganizationId: _.constant(1), getId: _.constant('1234') },
      apiKeyRepo: { getAll: this.getApiKeys },
      organization: {
        subscriptionPlan: {
          limits: {
            permanent: this.resource.limits.maximum
          }
        },
        usage: {
          permanent: this.resource.usage
        }
      }
    });

    this.create = () => {
      $inject('$controller')('ApiKeyListController', {
        $scope: this.scope,
        spaceContext: this.spaceContext
      });
      $apply();
    };
  });

  describe('empty marker', () => {
    it('is true', function() {
      this.getApiKeys.resolves([]);
      this.create();

      expect(this.scope.empty).toBeTruthy();
    });

    it('is false', function() {
      this.getApiKeys.resolves([{}]);
      this.create();
      expect(this.scope.empty).toBeFalsy();
    });
  });

  describe('has reached the API keys limit', () => {
    it('under keys limit', function() {
      this.resource.usage = 0;
      this.create();
      expect(this.scope.reachedLimit).toBeFalsy();
    });

    it('reached the limit', function() {
      this.resource.usage = 10;
      this.create();
      expect(this.scope.reachedLimit).toBeTruthy();
    });
  });

  describe('refreshing api keys', () => {
    it('saves api keys on scope', function() {
      this.getApiKeys.resolves({});
      this.create();
      expect(this.scope.apiKeys).toEqual({});
    });
  });

  describe('refreshing api keys fails', () => {
    it('results in an error message', function() {
      this.getApiKeys.rejects();
      this.create();
      sinon.assert.called(stubs.apiErrorHandlerStub);
    });
  });
});
