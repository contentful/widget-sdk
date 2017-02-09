'use strict';

// TODO merge this with directive tests
describe('API Key List Controller', function () {
  beforeEach(function () {
    module('contentful/test');

    this.scope = this.$inject('$rootScope').$new();
    this.scope.context = {};

    this.getApiKeys = sinon.stub();
    this.spaceContext = _.extend(this.$inject('spaceContext'), {
      getData: _.constant(2),
      space: {getOrganizationId: _.constant(1)},
      apiKeyRepo: {getAll: this.getApiKeys}
    });

    this.create = () => {
      this.$inject('$controller')('ApiKeyListController', {
        $scope: this.scope
      });
      this.scope.$digest();
    };
  });

  describe('empty marker', function () {
    it('is true', function () {
      this.getApiKeys.resolves([]);
      this.create();
      expect(this.scope.empty).toBeTruthy();
    });

    it('is false', function () {
      this.getApiKeys.resolves([{}]);
      this.create();
      expect(this.scope.empty).toBeFalsy();
    });
  });

  describe('has reached the API keys limit', function () {
    it('under keys limit', function () {
      this.getApiKeys.resolves([{}]);
      this.create();
      expect(this.scope.reachedLimit).toBeFalsy();
    });

    it('reached the limit', function () {
      this.getApiKeys.resolves([{}, {}]);
      this.create();
      expect(this.scope.reachedLimit).toBeTruthy();
    });
  });

  describe('refreshing api keys', function () {
    it('saves api keys on scope', function () {
      this.getApiKeys.resolves({});
      this.create();
      expect(this.scope.apiKeys).toEqual({});
    });
  });

  describe('refreshing api keys fails', function () {
    it('results in an error message', function () {
      this.getApiKeys.rejects();
      this.create();
      sinon.assert.called(this.$inject('ReloadNotification').apiErrorHandler);
    });
  });
});
