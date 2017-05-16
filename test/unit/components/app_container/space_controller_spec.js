import * as sinon from 'helpers/sinon';

describe('Space Controller', function () {
  beforeEach(function () {
    const self = this;
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
    });

    this.tokenStore = this.mockService('tokenStore', {
      getTokenLookup: sinon.stub()
    });
    this.$rootScope = this.$inject('$rootScope');
    this.scope = this.$rootScope.$new();
    const cfStub = this.$inject('cfStub');

    const space = cfStub.space('test');
    const contentTypeData = cfStub.contentTypeData('testType');
    this.scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

    this.$inject('$controller')('SpaceController', {$scope: this.scope});
  });

  describe('watches for updated tokenLookup', function () {
    beforeEach(function () {
      this.tokenStore.getTokenLookup.returns({items: [{sys: {}}]});
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
