import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';

describe('Client Controller', () => {
  let scope;

  afterEach(() => {
    scope = null;
  });

  beforeEach(function () {
    module('contentful/test', ($provide) => {
      $provide.value('analytics/Analytics', {
        enable: sinon.stub(),
        disable: sinon.stub(),
        track: sinon.stub()
      });

      this.authorizationStubs = {
        update: sinon.stub(),
        authContext: {
          hasSpace: sinon.stub()
        }
      };
      $provide.value('authorization', this.authorizationStubs);

      this.getEnforcements = sinon.stub();
      $provide.value('services/Enforcements', {
        getEnforcements: this.getEnforcements
      });
    });
    this.tokenStore = this.$inject('services/TokenStore');
    this.tokenStore.refresh = sinon.stub().resolves();
    this.tokenStore.user$ = K.createMockProperty();
    this.tokenStore.getTokenLookup = sinon.stub().returns({});

    this.refreshNavState = sinon.stub();
    this.$inject('navigation/NavState').makeStateRefresher = () => this.refreshNavState;

    const $rootScope = this.$inject('$rootScope');
    scope = $rootScope.$new();
    this.$inject('$controller')('ClientController', {$scope: scope});
  });

  describe('aux panel preferences', () => {
    it('aux panel is off by default', () => {
      expect(scope.preferences.showAuxPanel).toBeFalsy();
    });

    it('toggles aux panel', () => {
      scope.preferences.toggleAuxPanel();
      expect(scope.preferences.showAuxPanel).toBeTruthy();
    });
  });

  describe('updates authorization data', () => {
    const TOKEN = {sys: {}};
    const ENFORCEMENTS = [];
    const ENV_ID = 'ENV ID';

    beforeEach(function () {
      this.spaceContext = this.$inject('spaceContext');
      this.spaceContext.getEnvironmentId = () => ENV_ID;
      this.spaceContext.space = null;
      this.tokenStore.getTokenLookup.returns(TOKEN);
      this.getEnforcements.returns(ENFORCEMENTS);
      this.$apply();
    });

    it('initializes authorization with correct data', function () {
      sinon.assert.calledWith(this.authorizationStubs.update,
        TOKEN,
        this.spaceContext.space,
        ENFORCEMENTS,
        ENV_ID
      );
    });

    it('on tokenLookup update', function () {
      const newToken = {sys: {}};
      this.tokenStore.getTokenLookup.returns(newToken);
      this.$apply();

      sinon.assert.calledWith(this.authorizationStubs.update.secondCall, newToken);
    });

    it('on spaceContext.space update', function () {
      const space = {
        getId: () => 'SPACE ID'
      };
      this.spaceContext.space = space;
      this.$apply();

      sinon.assert.calledWith(
        this.authorizationStubs.update.secondCall,
        sinon.match.any,
        this.spaceContext.space
      );
    });

    it('on enforcements update', function () {
      this.$apply();

      const enforcements = [{sys: {id: 'E_1'}}];
      this.getEnforcements.returns(enforcements);

      this.$apply();

      sinon.assert.calledWith(
        this.authorizationStubs.update.secondCall,
        sinon.match.any,
        sinon.match.any,
        enforcements
      );
    });

    it('updates nav state', function () {
      this.$apply();
      sinon.assert.calledOnce(this.refreshNavState);
    });
  });

  describe('initializes client', () => {
    beforeEach(function () {
      this.user = {sys: {}};
      this.tokenStore.user$.set(this.user);
      scope.$digest();
    });

    it('sets user', function () {
      expect(scope.user).toEqual(this.user);
    });
  });

  describe('organizations on the scope', () => {
    let logger;

    beforeEach(function () {
      logger = this.$inject('logger');
    });

    afterEach(() => {
      logger = null;
    });

    describe('if user exists', () => {
      let user, org1, org2, org3;
      beforeEach(function () {
        org1 = {org1: true};
        org2 = {org2: true};
        org3 = {org3: true};
        user = {
          organizationMemberships: [
            {organization: org1}, {organization: org2}, {organization: org3}
          ]
        };

        this.prepare = function () {
          this.tokenStore.user$.set(user);
        };

        this.analytics = this.$inject('analytics/Analytics');
        this.intercom = this.$inject('intercom');
        this.intercom.disable = sinon.stub();
      });

      it('sets analytics user data and enables tracking', function () {
        this.prepare();
        sinon.assert.calledWithExactly(this.analytics.enable, user);
        sinon.assert.calledWithExactly(logger.enable, user);
      });

      it('should not set or enable anything when analytics are disallowed', function () {
        const features = this.$inject('features');
        features.allowAnalytics = sinon.stub().returns(false);
        this.prepare();
        sinon.assert.notCalled(this.analytics.enable);
        sinon.assert.called(this.analytics.disable);
        sinon.assert.called(this.intercom.disable);
        sinon.assert.called(logger.disable);
      });
    });
  });
});
