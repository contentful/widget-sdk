import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';

describe('Client Controller', function () {
  let scope;

  afterEach(function () {
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
        setTokenLookup: sinon.stub(),
        setSpace: sinon.stub(),
        authContext: {
          hasSpace: sinon.stub()
        }
      };
      $provide.value('authorization', this.authorizationStubs);
    });
    this.tokenStore = this.$inject('services/TokenStore');
    this.tokenStore.refresh = sinon.stub().resolves();
    this.tokenStore.user$ = K.createMockProperty();
    this.tokenStore.getTokenLookup = sinon.stub().returns({});

    const $rootScope = this.$inject('$rootScope');
    scope = $rootScope.$new();
    this.$inject('$controller')('ClientController', {$scope: scope});
  });

  describe('aux panel preferences', function () {
    it('aux panel is off by default', function () {
      expect(scope.preferences.showAuxPanel).toBeFalsy();
    });

    it('toggles aux panel', function () {
      scope.preferences.toggleAuxPanel();
      expect(scope.preferences.showAuxPanel).toBeTruthy();
    });
  });

  describe('on tokenLookup update', function () {
    it('it calls authorization.setTokenLookup', function () {
      const TOKEN = {sys: {}};
      this.tokenStore.getTokenLookup.returns(TOKEN);
      this.$apply();
      sinon.assert.calledWith(this.authorizationStubs.setTokenLookup, TOKEN);
    });
  });

  describe('on spaceContext.space update', function () {
    beforeEach(function () {
      this.spaceContext = this.$inject('spaceContext');
      this.hasSpace = sinon.stub().returns(false);
      this.authorizationStubs.authContext = {hasSpace: this.hasSpace};
    });

    it('sets authorization space if authContext has space', function () {
      this.hasSpace.withArgs('SPACE ID').returns(true);
      this.spaceContext.space = {
        getId: sinon.stub().returns('SPACE ID')
      };
      this.spaceContext.organizationContext = {
        getOrganization: sinon.stub().resolves({sys: {id: '1'}})
      };
      sinon.assert.notCalled(this.authorizationStubs.setSpace);
      this.$apply();
      sinon.assert.calledWith(this.authorizationStubs.setSpace, this.spaceContext.space);
    });

    it('does not set authorization space if authContext does not have space', function () {
      this.spaceContext.space = {
        getId: sinon.stub().returns('SPACE ID')
      };
      this.spaceContext.organizationContext = {
        getOrganization: sinon.stub().resolves({sys: {id: '1'}})
      };
      this.$apply();
      sinon.assert.notCalled(this.authorizationStubs.setSpace);
    });
  });

  describe('shows create space dialog', function () {
    beforeEach(function () {
      this.$inject('services/OrganizationRoles').setUser({
        organizationMemberships: [
          {organization: {sys: {id: 'abc'}}},
          {organization: {sys: {id: 'def'}}}
        ]
      });
      this.modalDialog = this.$inject('modalDialog');
      this.modalDialog.open = sinon.stub().returns({promise: this.$inject('$q').when()});
      this.spaceContext = this.$inject('spaceContext');
      this.spaceContext.organization = {sys: {}};
    });

    it('opens dialog', async function () {
      await scope.showCreateSpaceDialog();
      sinon.assert.called(this.modalDialog.open);
    });
  });

  describe('initializes client', function () {
    beforeEach(function () {
      this.user = {sys: {}};

      const Revision = this.$inject('revision');
      this.hasNewVersion = Revision.hasNewVersion = sinon.stub().resolves(true);
      this.clock = sinon.useFakeTimers();
      scope.initClient();
      this.tokenStore.user$.set(this.user);

      scope.$digest();
    });

    afterEach(function () {
      this.clock.restore();
    });

    it('sets user', function () {
      expect(scope.user).toEqual(this.user);
    });

    describe('new version check', function () {
      const A_SECOND = 1000;
      const A_MINUTE = 60 * A_SECOND;

      beforeEach(function () {
        const env = this.$inject('environment');
        env.settings.disableUpdateCheck = false;
      });

      it('is run five seconds after loading', function () {
        sinon.assert.notCalled(this.hasNewVersion);
        this.clock.tick(5 * A_SECOND);
        this.$apply();
        sinon.assert.calledOnce(this.hasNewVersion);
      });

      it('is run five minutes after loading', function () {
        this.clock.tick(5 * A_SECOND);
        this.$apply();
        this.hasNewVersion.resetHistory();
        this.clock.tick(5 * A_MINUTE);
        this.$apply();
        sinon.assert.calledOnce(this.hasNewVersion);
      });

      it('is not run five minutes after loading if user is inactive', function () {
        const presence = this.$inject('presence');
        presence.isActive = sinon.stub().returns(false);

        this.clock.tick(5 * A_SECOND);
        this.$apply();
        this.hasNewVersion.resetHistory();
        this.clock.tick(5 * A_MINUTE);
        this.$apply();
        sinon.assert.notCalled(this.hasNewVersion);
      });

      it('broadcasts notification only if there is a new version', function () {
        const $rootScope = this.$inject('$rootScope');
        const onNotification = sinon.stub();
        $rootScope.$on('persistentNotification', onNotification);

        this.hasNewVersion.resolves(false);
        this.clock.tick(5 * A_MINUTE);
        this.$apply();
        sinon.assert.called(this.hasNewVersion);
        sinon.assert.notCalled(onNotification);

        this.hasNewVersion.resolves(true);
        this.clock.tick(5 * A_MINUTE);
        this.$apply();
        sinon.assert.called(this.hasNewVersion);
        sinon.assert.called(onNotification);
      });
    });


    describe('presence timeout is fired', function () {
      beforeEach(function () {
        this.presence = this.$inject('presence');
        this.presence.isActive = sinon.stub().returns(true);
      });

      it('checks for presence', function () {
        sinon.assert.notCalled(this.presence.isActive);
        this.clock.tick(50 * 60 * 1000);
        sinon.assert.called(this.presence.isActive);
      });
    });
  });

  describe('organizations on the scope', function () {
    let logger;

    beforeEach(function () {
      logger = this.$inject('logger');
    });

    afterEach(function () {
      logger = null;
    });

    describe('if user exists', function () {
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
