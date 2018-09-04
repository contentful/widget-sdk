import * as sinon from 'helpers/sinon';

describe('Space Controller', () => {
  beforeEach(function() {
    const self = this;
    module('contentful/test', $provide => {
      self.authorizationMock = { isUpdated: sinon.stub() };
      $provide.value('authorization', self.authorizationMock);

      self.enforcementsMock = { getPeriodUsage: sinon.stub() };
      $provide.value('access_control/Enforcements.es6', self.enforcementsMock);

      self.analyticsMock = { track: sinon.stub() };
      $provide.value('analytics/Analytics.es6', self.analyticsMock);
    });

    this.tokenStore = this.mockService('services/TokenStore.es6', {
      getTokenLookup: sinon.stub()
    });
    this.$rootScope = this.$inject('$rootScope');

    this.$inject('$controller')('SpaceController', { $scope: this.$rootScope.$new() });
  });

  describe('watches for updated tokenLookup', () => {
    beforeEach(function() {
      this.tokenStore.getTokenLookup.returns({ items: [{ sys: {} }] });
      this.authorizationMock.isUpdated.returns(true);
      this.enforcementsMock.getPeriodUsage.returns(true);
      this.broadcastStub = sinon.spy(this.$rootScope, '$broadcast');
      this.$apply();
    });

    afterEach(function() {
      this.broadcastStub.restore();
    });

    it('gets period usage', function() {
      sinon.assert.called(this.enforcementsMock.getPeriodUsage);
    });

    it('broadcasts event if usage exceeded', function() {
      sinon.assert.called(this.broadcastStub);
    });
  });
});
