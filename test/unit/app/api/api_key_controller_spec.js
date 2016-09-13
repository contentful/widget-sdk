'use strict';

describe('API Key Controller', function () {

  const spaceContextStub = { space: {} };

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('spaceContext', spaceContextStub);
    });
    const $controller = this.$inject('$controller');
    const $rootScope = this.$inject('$rootScope');
    this.scope = $rootScope.$new();
    $controller('ApiKeyController as controller', { $scope: this.scope });

    spaceContextStub.space.getDeliveryApiKeys = sinon.stub().resolves([{}, {}, {}]);

  });

  describe('#getApiKeyList', function () {

    it('fetches keys', function () {
      this.scope.controller.getApiKeyList()
      .then(function (res) {
        expect(res.length).toBe(3);
        sinon.assert.calledOnce(spaceContextStub.space.getDeliveryApiKeys);
      });
    });

    it('does not refetch keys', function () {
      this.scope.controller.getApiKeyList();
      this.scope.controller.getApiKeyList();
      this.scope.controller.getApiKeyList();
      sinon.assert.calledOnce(spaceContextStub.space.getDeliveryApiKeys);
    });

    it('refetches keys if called with refresh=true', function () {
      this.scope.controller.getApiKeyList();
      this.scope.controller.getApiKeyList(true);
      sinon.assert.calledTwice(spaceContextStub.space.getDeliveryApiKeys);
    });

  });
});
