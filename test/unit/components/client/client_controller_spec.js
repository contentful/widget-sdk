'use strict';

/* eslint-disable no-unused-vars */
describe('Client Controller', function () {
  var clientController, scope, TheAccountView, spaceContext;
  var stubs;

  afterEach(function () {
    clientController = scope = TheAccountView = spaceContext = stubs = null;
  });

  function setMockOnContext (context, mockKey, stubsList) {
    context[mockKey] = {};
    _.each(stubsList, function (val) {
      context[mockKey][val] = sinon.stub();
    }, context);
  }

  beforeEach(function () {
    var self = this;
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'numVisible',
        'spaceId'
      ]);

      $provide.value('$document', [{ title: '' }]);

      setMockOnContext(self, 'analyticsStubs', [
        'enable',
        'disable',
        'track'
      ]);
      $provide.value('analytics', self.analyticsStubs);

      setMockOnContext(self, 'analyticsEventsStubs', [
        'trackToggleAuxPanel'
      ]);

      $provide.value('analyticsEvents', self.analyticsEventsStubs);

      self.authorizationStubs = {
        setTokenLookup: sinon.stub(),
        setSpace: sinon.stub(),
        authContext: {
          hasSpace: sinon.stub()
        }
      };
      $provide.value('authorization', self.authorizationStubs);

      setMockOnContext(self, 'tokenStoreStubs', [
        'refreshWithLookup',
        'refresh'
      ]);
      self.tokenStoreStubs.changed = {attach: sinon.stub()};
      $provide.value('tokenStore', self.tokenStoreStubs);

      self.featuresStubs = {
        allowAnalytics: sinon.stub().returns(true)
      };
      $provide.value('features', self.featuresStubs);

      self.windowStubs = {
        open: sinon.stub()
      };
      $provide.value('$window', {
        open: self.windowStubs.open,
        addEventListener: sinon.stub()
      });

      setMockOnContext(self, 'routingStubs', [
        'goToSpace',
        'goToOrganization',
        'getSpaceId',
        'getRoute'
      ]);
      $provide.value('routing', self.routingStubs);

      self.locationStubs = {
        url: sinon.stub()
      };
      $provide.value('$location', self.locationStubs);

      self.clientStubs = {
        newSpace: sinon.stub()
      };
      $provide.value('client', self.clientStubs);

      self.modalDialogStubs = {
        open: sinon.stub()
      };
      $provide.value('modalDialog', self.modalDialogStubs);

      self.presenceStubs = {
        isActive: sinon.stub()
      };
      $provide.value('presence', self.presenceStubs);

      self.reloadNotificationStubs = {
        trigger: sinon.stub(),
        gatekeeperErrorHandler: sinon.stub()
      };
      $provide.value('ReloadNotification', self.reloadNotificationStubs);

      self.revisionStubs = {
        hasNewVersion: sinon.stub()
      };
      $provide.value('revision', self.revisionStubs);

      self.enforcementsStubs = {
        setUser: sinon.stub()
      };
      $provide.value('enforcements', self.enforcementsStubs);
    });
    inject(function () {
      this.$rootScope = this.$inject('$rootScope');
      this.$stateParams = this.$inject('$stateParams');

      TheAccountView = this.$inject('TheAccountView');

      spaceContext = this.$inject('spaceContext');
      var space = this.$inject('cfStub').space('');
      space.getId = stubs.spaceId;
      var TheLocaleStore = this.$inject('TheLocaleStore');
      TheLocaleStore.resetWithSpace = sinon.stub();

      sinon.stub(spaceContext, 'refreshContentTypes');
      spaceContext.resetWithSpace(space);
      spaceContext.refreshContentTypes.restore();

      scope = this.$rootScope.$new();
      clientController = this.$inject('$controller')('ClientController', {$scope: scope});
    });
  });

  it('aux panel is off', function () {
    expect(scope.preferences.showAuxPanel).toBeFalsy();
  });

  describe('toggles aux panel', function () {
    beforeEach(function () {
      scope.preferences.toggleAuxPanel();
    });

    it('aux panel is on', function () {
      expect(scope.preferences.showAuxPanel).toBeTruthy();
    });

    it('analytics is triggered', function () {
      sinon.assert.calledWith(this.analyticsEventsStubs.trackToggleAuxPanel, true, '');
    });
  });

  describe('on space and token lookup updates', function () {
    beforeEach(function () {
      stubs.spaceId.returns(123);
      this.authorizationStubs.authContext.hasSpace.withArgs(123).returns(true);
      spaceContext.space = _.extend(spaceContext.space, {cloned: true});
      this.$inject('authentication').tokenLookup = {};
      scope.$digest();
    });

    it('token lookup is called', function () {
      sinon.assert.called(this.authorizationStubs.setTokenLookup);
    });

    it('space id is called', function () {
      sinon.assert.called(stubs.spaceId);
    });

    it('hasSpace is called', function () {
      sinon.assert.called(this.authorizationStubs.authContext.hasSpace);
    });

    it('setSpace is called', function () {
      sinon.assert.calledWith(this.authorizationStubs.setSpace, spaceContext.space);
    });
  });

  describe('handle route change', function () {
    var childScope;

    beforeEach(function () {
      childScope = scope.$new();
      spaceContext.getId = sinon.stub().returns(321);
    });

    afterEach(function () {
      childScope = null;
    });

    it('location in account flag is false', function () {
      this.$stateParams.spaceId = '123';
      childScope.$emit('$stateChangeSuccess');
      expect(TheAccountView.isActive()).toBeFalsy();
    });

  });

  describe('shows create space dialog', function () {
    beforeEach(function () {
      this.$inject('OrganizationList').resetWithUser({
        organizationMemberships: [
          {organization: {sys: {id: 'abc'}}},
          {organization: {sys: {id: 'def'}}}
        ]
      });
      this.modalDialogStubs.open.returns({promise: this.$inject('$q').when()});
    });

    it('opens dialog', function () {
      scope.showCreateSpaceDialog();
      sinon.assert.called(this.modalDialogStubs.open);
    });

    it('tracks analytics event', function () {
      scope.showCreateSpaceDialog();
      sinon.assert.called(this.analyticsStubs.track);
    });
  });

  describe('initializes client', function () {
    beforeEach(function () {
      this.user = {sys: {}};


      this.revisionStubs.hasNewVersion = sinon.stub().resolves(true);
      this.tokenStoreStubs.refresh.resolves();
      this.broadcastStub = sinon.stub(this.$rootScope, '$broadcast');
      jasmine.clock().install();
      scope.initClient();
      this.tokenStoreStubs.changed.attach.firstCall.args[0]({
        spaces: [],
        user: this.user
      });
      scope.$digest();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
      this.broadcastStub.restore();
    });

    it('sets user', function () {
      expect(scope.user).toEqual(this.user);
    });

    describe('fires an initial version check', function () {
      beforeEach(function () {
        jasmine.clock().tick(5000);
        scope.$digest();
      });
      it('checks for new version', function () {
        sinon.assert.called(this.revisionStubs.hasNewVersion);
      });

      it('broadcasts event if new version is available', function () {
        sinon.assert.called(this.broadcastStub);
      });
    });


    describe('presence timeout is fired', function () {
      beforeEach(function () {
        this.presenceStubs.isActive.returns(true);
        this.tokenStoreStubs.refresh.rejects();
        jasmine.clock().tick(50 * 60 * 1000);
        scope.$digest();
      });

      it('checks for presence', function () {
        sinon.assert.called(this.presenceStubs.isActive);
      });

      it('reload is triggered if lookup fails', function () {
        sinon.assert.called(this.reloadNotificationStubs.trigger);
      });
    });

  });

  describe('organizations on the scope', function () {
    var OrganizationList, logger;

    beforeEach(function () {
      OrganizationList = this.$inject('OrganizationList');
      logger = this.$inject('logger');
    });

    afterEach(function () {
      OrganizationList = logger = null;
    });

    it('are initially not set', function () {
      expect(OrganizationList.isEmpty()).toBe(true);
    });

    describe('if user exists', function () {
      var user, org1, org2, org3;
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
          var subscriber = this.tokenStoreStubs.changed.attach.firstCall.args[0];
          subscriber({user: user});
        }.bind(this);
      });

      it('are set', function () {
        this.prepare();
        expect(OrganizationList.getAll()).toEqual([org1, org2, org3]);
      });

      it('sets analytics user data and enables tracking', function () {
        this.prepare();
        sinon.assert.calledWithExactly(this.analyticsStubs.enable, user);
        sinon.assert.calledWithExactly(logger.enable, user);
      });

      it('should not set or enable anything when analytics are disallowed', function () {
        this.featuresStubs.allowAnalytics.returns(false);
        this.prepare();
        sinon.assert.notCalled(this.analyticsStubs.enable);
        sinon.assert.called(this.analyticsStubs.disable);
        sinon.assert.called(logger.disable);
      });
    });
  });
});
