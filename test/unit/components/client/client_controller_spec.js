'use strict';

describe('Client Controller', function () {
  var clientController, scope, notification;
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
          organization: sinon.stub(),
          can: sinon.stub()
        }
      };
      $provide.value('authorization', self.authorizationStubs);

      self.authorizationStubs.authContext.organization.returns({can: self.authorizationStubs.authContext.can});

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
      }
      $provide.value('ReloadNotification', self.reloadNotificationStubs);

      self.revisionStubs = {
        hasNewVersion: sinon.stub()
      };
      $provide.value('revision', self.revisionStubs);

      self.enforcementsStubs = {
        determineEnforcement: sinon.stub(),
        setSpaceContext: sinon.stub()
      };
      $provide.value('enforcements', self.enforcementsStubs);

      self.reasonsDeniedStub = sinon.stub();
      $provide.value('reasonsDenied', self.reasonsDeniedStub);

    });
    inject(function ($controller, $rootScope, $q, $injector){
      this.$q = $q;
      notification = $injector.get('notification');
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

  it('space switcher analytics tracking', function () {
    scope.clickedSpaceSwitcher();
    sinon.assert.called(this.analyticsStubs.track);
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
        scope.locationInAccount = true;
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
        expect(scope.locationInAccount).toBeFalsy();
      });
    });
  });

  describe('select organization', function() {
    beforeEach(function() {
      scope.organizations = [{
        sys: {
          id: '1234',
          createdBy: {
            sys: {
              id: '456'
            }
          }
        },
        name: 'orgname'
      }];
      scope.user = {
        sys: {id: '456'}
      };
      scope.canSelectOrg = sinon.stub();
    });

    describe('cannot select org', function() {
      beforeEach(function() {
        scope.canSelectOrg.returns(false);
        scope.selectOrg('1234');
      });

      it('does not tracks analytics', function () {
          sinon.assert.notCalled(this.analyticsStubs.track);
        });

      it('does not route to anywhere', function () {
        sinon.assert.notCalled(stubs.go);
      });

    });

    describe('can select org', function() {
      beforeEach(function() {
        scope.canSelectOrg.returns(true);
        scope.selectOrg('1234');
      });

      it('tracks analytics', function () {
          sinon.assert.called(this.analyticsStubs.track);
        });

      it('tracks the org properties', function () {
        expect(this.analyticsStubs.track.args[0][1]).toEqual({
          organizationId: '1234', organizationName: 'orgname'
        });
      });

      it('routes to selected org', function () {
        sinon.assert.calledWith(stubs.go, 'account.pathSuffix', {
          pathSuffix: 'organizations/1234/edit'
        });
      });
    });

  });

  describe('check if user can select an organization', function() {
    beforeEach(function() {
      scope.user = {
        organizationMemberships: [{
          organization: {
            sys: {
              id: '1234',
              createdBy: {
                sys: {
                  id: '456'
                }
              }
            }
          }
        }]
      };
    });

    it('as an owner', function() {
      scope.user.organizationMemberships[0].role = 'owner';
      expect(scope.canSelectOrg('1234')).toBeTruthy();
    });

    it('as an admin', function() {
      scope.user.organizationMemberships[0].role = 'admin';
      expect(scope.canSelectOrg('1234')).toBeTruthy();
    });

    it('as an user', function() {
      scope.user.organizationMemberships[0].role = 'user';
      expect(scope.canSelectOrg('1234')).toBeFalsy();
    });

    it('with no memberships', function() {
      scope.user.organizationMemberships = [];
      expect(scope.canSelectOrg('1234')).toBeFalsy();
    });
  });

  describe('handle route change', function () {
    var childScope;
    var idStub;
    beforeEach(function () {
      childScope = scope.$new();
      scope.getCurrentSpaceId = sinon.stub();
      scope.getCurrentSpaceId.returns(123);

      idStub = sinon.stub();
    });

    describe('no spaces exist', function () {
      beforeEach(function () {
        scope.spaces = null;
        childScope.$emit('$routeChangeSuccess', {viewType: null});
      });

      it('sets no space data on analytics', function () {
        sinon.assert.notCalled(this.analyticsStubs.setSpace);
      });
    });

    describe('does not change route to the same space', function () {
      beforeEach(function () {
        scope.spaces = [];
        childScope.$emit('$routeChangeSuccess', {params: {spaceId: 123}, viewType: null});
      });

      it('sets no space data on analytics', function () {
        sinon.assert.notCalled(this.analyticsStubs.setSpace);
      });

      it('location in account flag is false', function() {
        expect(scope.locationInAccount).toBeFalsy();
      });
    });

    describe('changing route to a different space', function () {
      beforeEach(function () {
        scope.spaces = [{getId: idStub}];
        idStub.returns(456);
        childScope.$emit('$stateChangeSuccess');
      });

      it('gets the space id', function () {
        sinon.assert.called(idStub);
      });

      it('switches to space', function () {
        sinon.assert.calledWith(this.analyticsStubs.setSpace, scope.spaces[0]);
      });

      it('location in account flag is false', function() {
        expect(scope.locationInAccount).toBeFalsy();
      });
    });

  });

  describe('watches for spaces array', function () {
    var idStub1, idStub2;
    beforeEach(function () {
      scope.spaces = null;
      scope.$digest();
      stubs.spaceId.returns(321);
      idStub1 = sinon.stub();
      idStub2 = sinon.stub();
      idStub1.returns(123);
      idStub2.returns(456);
      scope.spaces = [
        {getId: idStub1, data: {organization: {sys: {id: 132}}}},
        {getId: idStub2, data: {organization: {sys: {id: 132}}}},
        scope.spaceContext.space
      ];
    });

    it('spaces are grouped by organization', function() {
      scope.$stateParams.spaceId = 123;
      scope.$digest();
      expect(scope.spacesByOrg).toEqual({
        132: [scope.spaces[0], scope.spaces[1]],
        456: [scope.spaces[2]]
      });
    });

    it('redirects to a non existent space and defaults to first space', function () {
      scope.$stateParams.spaceId = 789;
      scope.$digest();
      sinon.assert.calledWith(stubs.go, 'spaces.detail', {
        spaceId: scope.spaces[0].getId()
      });
    });

    describe('redirects to the current space', function () {
      beforeEach(function () {
        scope.spaces = [];
        scope.$stateParams.spaceId = 321;
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        sinon.assert.notCalled(stubs.go);
      });

      it('sets analytics data', function () {
        sinon.assert.called(this.analyticsStubs.setSpace);
      });

      it('sets a location url', function () {
        sinon.assert.called(this.locationStubs.url);
      });
    });

    describe('redirects to the current space', function () {
      beforeEach(function () {
        scope.$stateParams.spaceId = 321;
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        sinon.assert.notCalled(stubs.go);
      });

      it('doesnt set analytics data', function () {
        sinon.assert.notCalled(this.analyticsStubs.setSpace);
      });
    });

    describe('no space can be found', function () {
      beforeEach(function () {
        scope.$stateParams.spaceId = 321;
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        sinon.assert.notCalled(stubs.go);
      });

      it('doesnt set analytics data', function () {
        sinon.assert.notCalled(this.analyticsStubs.setSpace);
      });
    });
  });

  describe('calls logout', function () {
    beforeEach(function () {
      scope.logout();
    });

    it('tracks analytics event', function () {
      sinon.assert.called(this.analyticsStubs.track);
    });

    it('logs out through authentication', function () {
      sinon.assert.called(this.authenticationStubs.logout);
    });
  });

  describe('open support', function () {
    beforeEach(function () {
      scope.openSupport();
    });

    it('opens new window', function () {
      sinon.assert.called(this.windowStubs.open);
    });

    it('gets support url', function () {
      sinon.assert.called(this.authenticationStubs.supportUrl);
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
      var token, mockSpace;
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

        mockSpace = {
          getId: sinon.stub(),
          update: sinon.stub()
        };

      }));

      describe('if the space already exists on the client', function() {
        beforeEach(function() {
          scope.spaces = [mockSpace];
          scope.spaces[0].getId.returns(123);

          childScope.$emit('iframeMessage', data);
        });

        it('sets token lookup', function() {
          sinon.assert.calledWith(this.authenticationStubs.updateTokenLookup, token);
        });

        it('sets user', function() {
          expect(scope.user).toBe(user);
        });

        it('updates spaces', function() {
          sinon.assert.calledWith(scope.spaces[0].update, spaces[0]);
        });
      });

      describe('if the space is not on the client', function() {
        beforeEach(function() {
          this.clientStubs.newSpace.returns(mockSpace);
          childScope.$emit('iframeMessage', data);
        });

        it('sets token lookup', function() {
          sinon.assert.calledWith(this.authenticationStubs.updateTokenLookup, token);
        });

        it('sets user', function() {
          expect(scope.user).toBe(user);
        });

        it('wraps the space', function() {
          sinon.assert.calledWith(this.clientStubs.newSpace, token.spaces[0]);
        });
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
        this.authenticationStubs.getTokenLookup.returns(this.$q.when());
        childScope.$emit('iframeMessage', data);
      });

      it('performs token lookup', function() {
        sinon.assert.called(this.authenticationStubs.getTokenLookup);
      });
    });


    describe('for other messages', function () {
      beforeEach(function () {
        data = {};
        this.authenticationStubs.getTokenLookup.returns(this.$q.when());
        childScope.$emit('iframeMessage', data);
      });

      it('performs token lookup', function() {
        sinon.assert.called(this.authenticationStubs.getTokenLookup);
      });
    });

  });

  it('tracks profile button click event', function () {
    scope.clickedProfileButton();
    sinon.assert.called(this.analyticsStubs.track);
  });

  describe('redirects to profile', function () {
    beforeEach(function() {
      scope.goToAccount();
    });

    it('goes there', function() {
      sinon.assert.calledWith(stubs.go, 'account.pathSuffix', {
        pathSuffix: undefined
      });
    });
  });

  describe('redirects to profile with a suffix', function () {
    beforeEach(function() {
      scope.goToAccount('section');
    });

    it('goes there', function() {
      sinon.assert.calledWith(stubs.go, 'account.pathSuffix', {
        pathSuffix: 'section' 
      });
    });
  });

  // FIXME: see refactoring notes in source code
  describe('performs token lookup', function () {
    var $q;
    var tokenDeferred;
    var tokenLookup = {
      sys: { createdBy: 'user' },
      spaces: [{sys: {id: 123}}]
    };
    beforeEach(inject(function ($injector) {
      $q = $injector.get('$q');
      tokenDeferred = $q.defer();
      this.authenticationStubs.getTokenLookup.returns(tokenDeferred.promise);

      scope.spaces = [{
        getId: sinon.stub(),
        update: sinon.stub()
      }];
      scope.spaces[0].getId.returns(123);

      scope.updateSpaces = sinon.stub();
      scope.performTokenLookup();
    }));

    it('expect getTokenLookup to be called', function () {
      sinon.assert.called(this.authenticationStubs.getTokenLookup);
    });

    describe('if token lookup resolves', function() {
      beforeEach(function() {
      tokenDeferred.resolve(tokenLookup);
      scope.$digest();
      });

      it('user is set to the provided one', function () {
        expect(scope.user).toEqual('user');
      });

      it('updates spaces', function() {
        sinon.assert.calledWith(scope.spaces[0].update, tokenLookup.spaces[0]);
      });
    });

    it('logs the user out on error 401', function () {
      this.modalDialogStubs.open.returns({promise: $q.when()});
      tokenDeferred.reject({statusCode: 401});
      scope.$apply();
      sinon.assert.called(this.authenticationStubs.logout);
    });
  });

  describe('check if user can create a space in any org', function() {
    beforeEach(function() {
      scope.organizations = [
        {sys: {id: 'abc'}},
        {sys: {id: 'def'}},
      ];
      scope.canCreateSpaceInOrg = sinon.stub();
    });

    it('if user cant create spaces in any organizations', function() {
      scope.canCreateSpaceInOrg.returns(false);
      expect(scope.canCreateSpaceInAnyOrg()).toBeFalsy();
    });

    it('if user can create spaces in any organizations', function() {
      scope.canCreateSpaceInOrg.returns(true);
      expect(scope.canCreateSpaceInAnyOrg()).toBeTruthy();
    });

    it('if user can create spaces in some organizations', function() {
      scope.canCreateSpaceInOrg.withArgs('abc').returns(false);
      scope.canCreateSpaceInOrg.withArgs('def').returns(true);
      expect(scope.canCreateSpaceInAnyOrg()).toBeTruthy();
    });

  });

  describe('check if user can create a space', function() {
    it('with no auth context', inject(function(authorization) {
      delete authorization.authContext;
      expect(scope.canCreateSpace()).toBeFalsy();
    }));

    it('with no organizations', function() {
      expect(scope.canCreateSpace()).toBeFalsy();
    });

    it('with zero organizations', function() {
      scope.organizations = [];
      expect(scope.canCreateSpace()).toBeFalsy();
    });

    describe('with organizations', function() {
      beforeEach(function() {
        scope.organizations = [
          {sys: {id: 'abc'}},
          {sys: {id: 'def'}},
        ];
        scope.canCreateSpaceInAnyOrg = sinon.stub();
      });

      it('if user cant create spaces in any organizations', function() {
        scope.canCreateSpaceInAnyOrg.returns(false);
        expect(scope.canCreateSpace()).toBeFalsy();
      });

      it('if authorization allows', function() {
        scope.canCreateSpaceInAnyOrg.returns(true);
        this.authorizationStubs.authContext.can.returns(true);
        expect(scope.canCreateSpace()).toBeTruthy();
      });

      describe('if authorization does not allow', function() {
        var result;
        beforeEach(function() {
          scope.canCreateSpaceInAnyOrg.returns(true);
          this.authorizationStubs.authContext.can.returns(false);
          scope.checkForEnforcements = sinon.stub();
          result = scope.canCreateSpace();
        });

        it('result is false', function() {
          expect(result).toBeFalsy();
        });

        it('checks for enforcements', function() {
          sinon.assert.called(scope.checkForEnforcements);
        });
      });

    });

  });


  describe('check if user can create space in org', function() {

    it('with no auth context', inject(function(authorization) {
      delete authorization.authContext;
      expect(scope.canCreateSpaceInOrg()).toBeFalsy();
    }));

    describe('with an auth context', function() {
      beforeEach(function() {
        scope.canCreateSpaceInOrg('orgid');
      });

      it('gets an organization', function() {
        sinon.assert.calledWith(this.authorizationStubs.authContext.organization, 'orgid');
      });

      it('checks for permission on organization', function() {
        sinon.assert.called(this.authorizationStubs.authContext.can);
      });
    });
  });


  describe('check for enforcements', function() {
    var args, broadcastStub;

    beforeEach(inject(function($rootScope) {
      args = [1, 2];
      broadcastStub = sinon.stub($rootScope, '$broadcast');
    }));

    describe('if there are reasons', function () {
      beforeEach(function () {
        this.enforcementsStubs.determineEnforcement.returns({});
        scope.checkForEnforcements(args, {});
      });

      it('enforcement is determined', function () {
        sinon.assert.called(this.enforcementsStubs.determineEnforcement);
      });

      it('reasons are determined', function () {
        sinon.assert.called(this.reasonsDeniedStub);
      });

      it('event is broadcast', function () {
        sinon.assert.called(broadcastStub);
      });
    });

    describe('if there are no reasons', function () {
      beforeEach(function () {
        this.enforcementsStubs.determineEnforcement.returns(false);
        scope.checkForEnforcements(args, {});
      });

      it('enforcement is determined', function () {
        sinon.assert.called(this.enforcementsStubs.determineEnforcement);
      });

      it('reasons are determined', function () {
        sinon.assert.called(this.reasonsDeniedStub);
      });

      it('event is not broadcast', function () {
        sinon.assert.notCalled(broadcastStub);
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
    var thenStub, catchStub, revisionCatchStub;
    beforeEach(function () {
      revisionCatchStub = sinon.stub();
      this.revisionStubs.hasNewVersion.returns({catch: revisionCatchStub});
      scope.performTokenLookup = sinon.stub();
      thenStub = sinon.stub();
      catchStub = sinon.stub();
      scope.performTokenLookup.returns({
        then: thenStub,
        catch: catchStub
      });
    });

    it('token lookup is called', function () {
      scope.initClient();
      sinon.assert.called(scope.performTokenLookup);
    });

    describe('if lookup succeeds', function () {
      beforeEach(function () {
        jasmine.clock().install();
        thenStub.callsArg(0);
        scope.user = {
          sys: {}
        };
        scope.spaces = [{}];
      });

      afterEach(function () {
        jasmine.clock().uninstall();
      });

      it('tracks login', function () {
        scope.initClient();
        sinon.assert.called(this.analyticsStubs.setUserData);
      });

      describe('fires an initial version check', function () {
        var broadcastStub;
        beforeEach(inject(function ($rootScope) {
          broadcastStub = sinon.stub($rootScope, '$broadcast');
          revisionCatchStub.callsArgWith(0, 'APP_REVISION_CHANGED');
          scope.initClient();
          jasmine.clock().tick(5000);
        }));

        afterEach(function () {
          broadcastStub.restore();
        });

        it('checks for new version', function () {
          sinon.assert.called(this.revisionStubs.hasNewVersion);
        });

        it('broadcasts event if new version is available', function () {
          sinon.assert.called(broadcastStub);
        });
      });


      describe('presence timeout is fired', function () {
        var broadcastStub;
        beforeEach(inject(function ($rootScope) {
          this.presenceStubs.isActive.returns(true);
          catchStub.callsArg(0);
          broadcastStub = sinon.stub($rootScope, '$broadcast');
          revisionCatchStub.callsArgWith(0, 'APP_REVISION_CHANGED');
          scope.initClient();
          jasmine.clock().tick(50*60*1000);
        }));

        afterEach(function () {
          broadcastStub.restore();
        });

        it('checks for presence', function () {
          sinon.assert.called(this.presenceStubs.isActive);
        });

        it('checks for new version', function () {
          sinon.assert.called(this.revisionStubs.hasNewVersion);
        });

        it('reload is triggered if lookup fails', function () {
          sinon.assert.called(this.reloadNotificationStubs.trigger);
        });

        it('broadcasts event if new version is available', function () {
          sinon.assert.called(broadcastStub);
        });
      });

    });

    describe('if lookup fails', function () {
      beforeEach(function () {
        thenStub.callsArg(1);
        scope.initClient();
      });

      it('error notification shown', function () {
        sinon.assert.called(this.reloadNotificationStubs.gatekeeperErrorHandler);
      });
    });

  });

  describe('organizations on the scope', function() {
    it('are not set', function() {
      expect(scope.organizations).toBeNull();
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

  it('gets organization name', function() {
    scope.organizations = [
      {name: 'orgname', sys: {id: '123'}}
    ];
    scope.$digest();
    expect(scope.getOrgName('123')).toEqual('orgname');
  });

  it('gets no organization name', function() {
    scope.organizations = [];
    scope.$digest();
    expect(scope.getOrgName('123')).toEqual('');
  });

});
