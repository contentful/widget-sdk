'use strict';

describe('Client Controller', function () {
  var clientController, scope, notification, TheAccountView;
  var stubs;

  function setMockOnContext(context, mockKey, stubsList) {
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
        'spaceId',
        'go',
      ]);

      $provide.removeControllers('TrialWatchController');

      $provide.factory('SpaceContext', function () {
        return function(){
          return {
            space: {
              getId: stubs.spaceId,
              data: {
                organization: {
                  sys: {
                    id: 456
                  }
                }
              }
            },
            tabList: {
              numVisible: stubs.numVisible,
              current: {}
            }
          };
        };
      });

      $provide.value('$document', [{ title: '' }]);

      setMockOnContext(self, 'analyticsStubs', [
        'enable',
        'disable',
        'toggleAuxPanel',
        'track',
        'setSpace',
        'setUserData',
        'stateActivated'
      ]);
      $provide.value('analytics', self.analyticsStubs);

      self.authorizationStubs = {
        setTokenLookup: sinon.stub(),
        setSpace: sinon.stub(),
        authContext: {
          hasSpace: sinon.stub(),
        }
      };
      $provide.value('authorization', self.authorizationStubs);

      setMockOnContext(self, 'tokenStoreStubs', [
        'updateTokenFromTokenLookup',
        'getToken',
        'getUpdatedToken'
      ]);
      $provide.value('tokenStore', self.tokenStoreStubs);

      self.featuresStubs = {
        shouldAllowAnalytics: sinon.stub()
      };
      self.featuresStubs.shouldAllowAnalytics.returns(true);
      $provide.value('features', self.featuresStubs);

      setMockOnContext(self, 'authenticationStubs', [
        'logout',
        'supportUrl',
        'goodbye',
        'setTokenLookup',
        'updateTokenLookup',
        'getTokenLookup'
      ]);
      $provide.value('authentication', self.authenticationStubs);

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
        'getRoute',
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
        setSpaceContext: sinon.stub()
      };
      $provide.value('enforcements', self.enforcementsStubs);
    });
    inject(function ($controller, $rootScope, $q, $injector){
      this.$q = $q;
      this.$rootScope = $rootScope;
      notification = $injector.get('notification');
      TheAccountView = $injector.get('TheAccountView');
      scope = $rootScope.$new();
      clientController = $controller('ClientController', {$scope: scope});
      scope.$state.go = stubs.go;
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
      sinon.assert.calledWith(this.analyticsStubs.toggleAuxPanel, true, '');
    });
  });

  describe('on space and token lookup updates', function () {
    beforeEach(inject(function (authentication) {
      stubs.spaceId.returns(123);
      this.authorizationStubs.authContext.hasSpace.withArgs(123).returns(true);
      scope.spaceContext.space = _.extend(scope.spaceContext.space, {cloned: true});
      authentication.tokenLookup = {};
      scope.$digest();
    }));

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
      sinon.assert.calledWith(this.authorizationStubs.setSpace, scope.spaceContext.space);
    });
  });

  it('gets current space id', function () {
    stubs.spaceId.returns(123);
    expect(scope.getCurrentSpaceId()).toBe(123);
  });

  describe('select a space', function () {
    var space;
    var idStub;
    beforeEach(function () {
      idStub = sinon.stub();
      stubs.spaceId.returns(123);
      space = {
        getId: idStub,
        data: {
          name: 'testspace'
        }
      };
    });

    it('with no space triggers an error notification', function () {
      scope.selectSpace();
      sinon.assert.called(notification.warn);
    });

    describe('if we are selecting the current space', function () {
      beforeEach(function () {
        idStub.returns(123);
        scope.selectSpace(space);
      });

      it('dont track analytics', function () {
        sinon.assert.notCalled(this.analyticsStubs.track);
      });

      it('dont route to another space', function () {
        sinon.assert.notCalled(stubs.go);
      });
    });

    describe('if we are selecting the current space but in account section', function () {
      beforeEach(function () {
        idStub.returns(123);
        TheAccountView.isActive = sinon.stub();
        TheAccountView.isActive.returns(true);
        scope.selectSpace(space);
      });

      it('tracks analytics', function () {
        sinon.assert.called(this.analyticsStubs.track);
      });

      it('tracks the space properties', function () {
        expect(this.analyticsStubs.track.args[0][1]).toEqual({spaceId: 123, spaceName: 'testspace'});
      });

      it('route to another space', function () {
        sinon.assert.calledWith(stubs.go, 'spaces.detail', { spaceId: 123 });
      });
    });

    describe('if we are selecting a different space', function () {
      beforeEach(function () {
        idStub.returns(456);
        scope.selectSpace(space);
      });

      it('tracks analytics', function () {
        sinon.assert.called(this.analyticsStubs.track);
      });

      it('tracks the space properties', function () {
        expect(this.analyticsStubs.track.args[0][1]).toEqual({spaceId: 456, spaceName: 'testspace'});
      });

      it('route to another space', function () {
        sinon.assert.calledWith(stubs.go, 'spaces.detail', { spaceId: 456 });
      });

      it('location in account set to false', function() {
        expect(TheAccountView.isActive()).toBeFalsy();
      });
    });
  });

  describe('handle route change', function () {
    var childScope;
    beforeEach(function () {
      childScope = scope.$new();
      scope.getCurrentSpaceId = sinon.stub();
      scope.getCurrentSpaceId.returns(321);
    });

    describe('changing route to a different space', function () {
      beforeEach(function () {
        scope.spaces = [{getId: function() { return 123; }}];
        childScope.$emit('$stateChangeSuccess');
      });

      it('switches to space', function () {
        sinon.assert.calledWith(this.analyticsStubs.setSpace, scope.spaces[0]);
      });

      it('location in account flag is false', function() {
        expect(TheAccountView.isActive()).toBeFalsy();
      });
    });

  });

  describe('handle iframe messages', function () {
    var childScope, data, user, spaces;
    beforeEach(function () {
      scope.showCreateSpaceDialog = sinon.stub();

      user = { user: true };
      childScope = scope.$new();
    });


    describe('new space', function () {
      beforeEach(function () {
        data = {
          action: 'new',
          type: 'space',
          organizationId: '123abc'
        };
        childScope.$emit('iframeMessage', data);
      });

      it('shows create space dialog', function() {
        sinon.assert.calledWith(scope.showCreateSpaceDialog, '123abc');
      });
    });

    describe('user cancellation', function () {
      beforeEach(function () {
        data = {
          action: 'create',
          type: 'UserCancellation'
        };
        childScope.$emit('iframeMessage', data);
      });

      it('calls authentication goodbye', function () {
        sinon.assert.called(this.authenticationStubs.goodbye);
      });
    });

    describe('on token change', function() {
      var token;
      beforeEach(inject(function (authentication) {
        spaces = [{
          sys: {id: 123}
        }];

        token = {
          sys: {
            createdBy: user
          },
          spaces: spaces
        };
        authentication.tokenLookup = token;

        data = {
          token: authentication.tokenLookup
        };

        this.tokenStoreStubs.getToken.returns({spaces: spaces, user: user});
        childScope.$emit('iframeMessage', data);
      }));

      it('sets token lookup', function() {
        sinon.assert.calledWith(this.authenticationStubs.updateTokenLookup, token);
      });

      it('sets user', function() {
        expect(scope.user).toBe(user);
      });
    });

    describe('flash message', function () {
      it('calls warn notification', function () {
        data = {
          type: 'flash',
          resource: {
            type: 'error',
            message: 'hai'
          }
        };
        childScope.$emit('iframeMessage', data);
        sinon.assert.calledWith(notification.warn, 'hai');
      });

      it('calls info notification', function () {
        data = {
          type: 'flash',
          resource: {
            type: '',
            message: 'hai'
          }
        };
        childScope.$emit('iframeMessage', data);
        sinon.assert.calledWith(notification.info, 'hai');
      });
    });

    describe('requests navigation', function () {
      beforeEach(function () {
        data = {
          type: 'location',
          action: 'navigate',
          path: '/foobar/baz'
        };
        childScope.$emit('iframeMessage', data);

      });

      it('calls into location', function() {
        sinon.assert.calledWith(this.locationStubs.url, '/foobar/baz');
      });
    });

    describe('location update', function () {
      beforeEach(function () {
        data = {
          type: 'location',
          action: 'update',
          path: '/foobar/baz'
        };
        childScope.$emit('iframeMessage', data);
      });

      it('performs no token lookup', function() {
        sinon.assert.notCalled(this.authenticationStubs.getTokenLookup);
      });
    });

    describe('space deleted', function () {
      beforeEach(function () {
        data = {
          type: 'space',
          action: 'delete',
        };
        this.tokenStoreStubs.getUpdatedToken.returns(this.$q.when());
        childScope.$emit('iframeMessage', data);
      });

      it('performs token lookup', function() {
        sinon.assert.called(this.tokenStoreStubs.getUpdatedToken);
      });
    });


    describe('for other messages', function () {
      beforeEach(function () {
        data = {};
        this.tokenStoreStubs.getUpdatedToken.returns(this.$q.when());
        childScope.$emit('iframeMessage', data);
      });

      it('performs token lookup', function() {
        sinon.assert.called(this.tokenStoreStubs.getUpdatedToken);
      });
    });

  });

  describe('redirects to profile', function () {
    beforeEach(function() {
      TheAccountView.goTo();
    });

    it('goes there', function() {
      sinon.assert.calledWith(stubs.go, 'account.pathSuffix', {
        pathSuffix: undefined
      });
    });
  });

  describe('redirects to profile with a suffix', function () {
    beforeEach(function() {
      TheAccountView.goTo('section');
    });

    it('goes there', function() {
      sinon.assert.calledWith(stubs.go, 'account.pathSuffix', {
        pathSuffix: 'section'
      });
    });
  });

  describe('shows create space dialog', function () {
    beforeEach(inject(function ($q) {
      scope.organizations = [
        {sys: {id: 'abc'}},
        {sys: {id: 'def'}},
      ];
      this.modalDialogStubs.open.returns({promise: $q.when()});
    }));
    it('opens dialog', function () {
      scope.showCreateSpaceDialog();
      sinon.assert.called(this.modalDialogStubs.open);
    });

    it('tracks analytics event', function () {
      scope.showCreateSpaceDialog();
      sinon.assert.called(this.analyticsStubs.track);
    });

    describe('with an organizationId', function () {
      it('displays that organization first in the dropdown', function () {
        scope.showCreateSpaceDialog('def');
        expect(this.modalDialogStubs.open.args[0][0].scope.organizations[1].sys.id).toBe('def');
      });
    });

    describe('without an organizationId', function () {
      it('displays that organization first in the dropdown', function () {
        scope.showCreateSpaceDialog();
        expect(this.modalDialogStubs.open.args[0][0].scope.organizations[0].sys.id).toBe('abc');
      });
    });
  });

  describe('initializes client', function () {
    beforeEach(function () {
      this.spaces = [];
      this.user = {sys: {}};
      this.revisionStubs.hasNewVersion.returns(this.$q.reject('APP_REVISION_CHANGED'));
      this.tokenStoreStubs.getUpdatedToken.returns(this.$q.when({
        spaces: this.spaces,
        user: this.user
      }));
      this.broadcastStub = sinon.stub(this.$rootScope, '$broadcast');
      jasmine.clock().install();
      scope.initClient();
      scope.$digest();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
      this.broadcastStub.restore();
    });

    it('tracks login', function () {
      sinon.assert.called(this.analyticsStubs.setUserData);
    });

    it('sets user', function() {
      expect(scope.user).toEqual(this.user);
    });

    it('sets spaces', function() {
      expect(scope.spaces).toEqual(this.spaces);
    });

    describe('fires an initial version check', function () {
      beforeEach(function() {
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
        this.tokenStoreStubs.getUpdatedToken.returns(this.$q.reject());
        jasmine.clock().tick(50*60*1000);
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

  describe('organizations on the scope', function() {
    it('are not set', function() {
      expect(scope.organizations).toBeFalsy();
    });

    describe('if user exists', function() {
      var org1, org2, org3;
      beforeEach(function() {
        org1 = {org1: true};
        org2 = {org2: true};
        org3 = {org3: true};
        scope.user = {
          organizationMemberships: [
            {organization: org1},
            {organization: org2},
            {organization: org3},
          ]
        };
        this.logger = this.$inject('logger');
      });

      it('are set', function() {
        scope.$digest();
        expect(scope.organizations).toEqual([
          org1, org2, org3
        ]);
      });

      it('sets analytics user data and enables tracking', function() {
        scope.$digest();
        sinon.assert.called(this.analyticsStubs.setUserData);
        sinon.assert.called(this.analyticsStubs.enable);
        sinon.assert.called(this.logger.enable);
      });

      describe('when analytics are disallowed', function() {
        beforeEach(function() {
          this.featuresStubs.shouldAllowAnalytics.returns(false);
        });

        it('should not set or enable anything', function() {
          scope.$digest();
          sinon.assert.notCalled(this.analyticsStubs.setUserData);
          sinon.assert.called(this.analyticsStubs.disable);
          sinon.assert.called(this.logger.disable);
        });
      });
    });
  });

});
