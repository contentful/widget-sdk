'use strict';

describe('Space Controller', function () {
  beforeEach(function () {
    var self = this;
    module('contentful/test', function ($provide) {
      self.authorizationMock = {
        isUpdated: sinon.stub()
      };
      $provide.value('authorization', self.authorizationMock);

      self.enforcementsMock = {
        getPeriodUsage: sinon.stub(),
        setSpaceContext: sinon.stub()
      };
      $provide.value('enforcements', self.enforcementsMock);

      self.analyticsMock = {
        track: sinon.stub()
      };
      $provide.value('analytics/Analytics', self.analyticsMock);

      self.TheLocaleStoreMock = {
        resetWithSpace: sinon.stub(),
        getPrivateLocales: sinon.stub(),
        refreshLocales: sinon.stub()
      };
      $provide.value('TheLocaleStore', self.TheLocaleStoreMock);
    });
    this.$rootScope = this.$inject('$rootScope');
    this.scope = this.$rootScope.$new();
    var cfStub = this.$inject('cfStub');

    var space = cfStub.space('test');
    var contentTypeData = cfStub.contentTypeData('testType');
    this.scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

    this.$inject('$controller')('SpaceController', {$scope: this.scope});
  });

  describe('watches for updated tokenLookup', function () {
    beforeEach(function () {
      var tokenLookup = this.$inject('tokenStore/lookup');
      tokenLookup.set({items: [{sys: {}}]});
      this.authorizationMock.isUpdated.returns(true);
      this.enforcementsMock.getPeriodUsage.returns(true);
      this.broadcastStub = sinon.stub(this.$rootScope, '$broadcast');
      this.scope.$digest();
    });

    afterEach(function () {
      this.broadcastStub.restore();
    });

    it('gets period usage', function () {
      sinon.assert.called(this.enforcementsMock.getPeriodUsage);
    });

    it('broadcasts event if usage exceeded', function () {
      sinon.assert.called(this.broadcastStub);
    });
  });
});
