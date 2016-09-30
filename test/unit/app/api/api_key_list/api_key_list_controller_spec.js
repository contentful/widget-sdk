'use strict';

describe('API Key List Controller', function () {
  beforeEach(function () {
    module('contentful/test');

    this.scope = this.$inject('$rootScope').$new();
    this.scope.context = {};

    this.spaceContext = _.extend(this.$inject('spaceContext'), {
      getData: _.constant(2),
      space: {getOrganizationId: _.constant(1)},
      apiKeys: {getDeliveryKeys: sinon.stub()}
    });

    this.create = () => {
      this.$inject('$controller')('ApiKeyListController', {
        $scope: _.extend(this.scope, {
          entityCreationController: {newApiKey: _.noop}
        })
      });
      this.scope.$digest();
    };
  });

  describe('empty marker', function () {
    it('is true', function () {
      this.spaceContext.apiKeys.getDeliveryKeys.resolves([]);
      this.create();
      expect(this.scope.empty).toBeTruthy();
    });

    it('is false', function () {
      this.spaceContext.apiKeys.getDeliveryKeys.resolves([{}]);
      this.create();
      expect(this.scope.empty).toBeFalsy();
    });
  });

  describe('has reached the API keys limit', function () {
    it('under keys limit', function () {
      this.spaceContext.apiKeys.getDeliveryKeys.resolves([{}]);
      this.create();
      expect(this.scope.reachedLimit).toBeFalsy();
    });

    it('reached the limit', function () {
      this.spaceContext.apiKeys.getDeliveryKeys.resolves([{}, {}]);
      this.create();
      expect(this.scope.reachedLimit).toBeTruthy();
    });
  });

  describe('refreshing api keys', function () {
    it('saves api keys on scope', function () {
      this.spaceContext.apiKeys.getDeliveryKeys.resolves({});
      this.create();
      expect(this.scope.apiKeys).toEqual({});
    });
  });

  describe('refreshing api keys fails', function () {
    it('results in an error message', function () {
      this.spaceContext.apiKeys.getDeliveryKeys.rejects();
      this.create();
      sinon.assert.called(this.$inject('ReloadNotification').apiErrorHandler);
    });
  });
});
