import * as sinon from 'test/helpers/sinon';
import * as K from 'test/helpers/mocks/kefir';

describe('Client Controller', () => {
  let scope;

  afterEach(() => {
    scope = null;
  });

  beforeEach(function() {
    this.getEnforcements = sinon.stub();
    this.logger = {
      enable: sinon.stub(),
      disable: sinon.stub()
    };
    this.isAnalyticsAllowed = sinon.stub().returns(true);

    module('contentful/test', $provide => {
      $provide.value('analytics/Analytics.es6', {
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
      $provide.constant('authorization', this.authorizationStubs);
      $provide.value('services/EnforcementsService.es6', {
        getEnforcements: this.getEnforcements
      });
      $provide.constant('analytics/isAnalyticsAllowed.es6', {
        default: this.isAnalyticsAllowed
      });
      $provide.constant('services/logger.es6', this.logger);
    });
    this.tokenStore = this.$inject('services/TokenStore.es6');
    this.tokenStore.refresh = sinon.stub().resolves();
    this.tokenStore.user$ = K.createMockProperty();
    this.tokenStore.getTokenLookup = sinon.stub().returns({});

    this.refreshNavState = sinon.stub();
    this.$inject('navigation/NavState.es6').makeStateRefresher = () => this.refreshNavState;

    const $rootScope = this.$inject('$rootScope');
    scope = $rootScope.$new();
    this.$inject('$controller')('ClientController', { $scope: scope });
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
    beforeEach(function() {
      this.token = { sys: {} };
      this.enforcements = [];
      this.envId = 'ENV ID';

      this.spaceContext = this.$inject('spaceContext');
      this.spaceContext.getEnvironmentId = () => this.envId;
      this.spaceContext.space = null;
      this.tokenStore.getTokenLookup.returns(this.token);
      this.getEnforcements.returns(this.enforcements);
      this.$apply();
    });

    it('initializes authorization with correct data', function() {
      sinon.assert.calledWith(
        this.authorizationStubs.update,
        this.token,
        this.spaceContext.space,
        this.enforcements,
        this.envId
      );
    });

    it('on tokenLookup update', function() {
      const newToken = { sys: {} };
      this.tokenStore.getTokenLookup.returns(newToken);
      this.$apply();

      sinon.assert.calledWith(this.authorizationStubs.update.secondCall, newToken);
    });

    it('on spaceContext.space update', function() {
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

    it('on enforcements update', function() {
      this.$apply();

      const enforcements = [{ sys: { id: 'E_1' } }];
      this.getEnforcements.returns(enforcements);

      this.$apply();

      sinon.assert.calledWith(
        this.authorizationStubs.update.secondCall,
        sinon.match.any,
        sinon.match.any,
        enforcements
      );
    });

    it('updates nav state', function() {
      this.$apply();
      sinon.assert.calledOnce(this.refreshNavState);
    });
  });

  describe('initializes client', () => {
    beforeEach(function() {
      this.user = { sys: {} };
      this.tokenStore.user$.set(this.user);
      scope.$digest();
    });

    it('sets user', function() {
      expect(scope.user).toEqual(this.user);
    });
  });

  describe('organizations on the scope', () => {
    describe('if user exists', () => {
      let user, org1, org2, org3;
      beforeEach(function() {
        org1 = { org1: true };
        org2 = { org2: true };
        org3 = { org3: true };
        user = {
          organizationMemberships: [
            { organization: org1 },
            { organization: org2 },
            { organization: org3 }
          ]
        };

        this.prepare = function() {
          this.tokenStore.user$.set(user);
        };

        this.analytics = this.$inject('analytics/Analytics.es6');
        this.intercom = this.$inject('intercom');
        this.intercom.disable = sinon.stub();
      });

      it('sets analytics user data and enables tracking', function() {
        this.prepare();
        sinon.assert.calledWithExactly(this.analytics.enable, user);
        sinon.assert.calledWithExactly(this.logger.enable, user);
      });

      it('should not set or enable anything when analytics are disallowed', function() {
        this.isAnalyticsAllowed.returns(false);
        this.prepare();
        sinon.assert.notCalled(this.analytics.enable);
        sinon.assert.called(this.analytics.disable);
        sinon.assert.called(this.intercom.disable);
        sinon.assert.called(this.logger.disable);
      });
    });
  });
});
