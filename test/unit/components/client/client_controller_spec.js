'use strict';

describe('Client Controller', function () {
  var clientController, scope, notification;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'numVisible',
        'spaceId',
        'enableAnalytics',
        'disableAnalytics',
        'auxPanel',
        'track',
        'authorizationTokenLookup',
        'authenticationTokenLookup',
        'updateTokenLookup',
        'getTokenLookup',
        'setSpace',
        'hasSpace',
        'gatekeeperErrorHandler',
        'goToSpace',
        'goToOrganization',
        'routingSpaceId',
        'setUserData',
        'setSpace',
        'getRoute',
        'path',
        'logout',
        'goodbye',
        'supportUrl',
        'open',
        'newSpace',
        'dialog',
        'presenceActive',
        'trigger',
        'hasNewVersion',
        'enforcement',
        'reasons',
        'organization',
        'can',
        'setSpaceContext',
        'shouldAllowAnalytics'
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

      $provide.value('analytics', {
        enable: stubs.enableAnalytics,
        disable: stubs.disableAnalytics,
        toggleAuxPanel: stubs.auxPanel,
        track: stubs.track,
        setSpace: stubs.setSpace,
        setUserData: stubs.setUserData,
      });

      $provide.value('authorization', {
        setTokenLookup: stubs.authorizationTokenLookup,
        setSpace: stubs.setSpace,
        authContext: {
          hasSpace: stubs.hasSpace,
          organization: stubs.organization,
          can: stubs.can
        }
      });

      stubs.organization.returns({can: stubs.can});

      $provide.value('features', {
        shouldAllowAnalytics: stubs.shouldAllowAnalytics.returns(true)
      });

      $provide.value('authentication', {
        logout: stubs.logout,
        supportUrl: stubs.supportUrl,
        goodbye: stubs.goodbye,
        setTokenLookup: stubs.authenticationTokenLookup,
        updateTokenLookup: stubs.updateTokenLookup,
        getTokenLookup: stubs.getTokenLookup
      });

      $provide.value('$window', {
        open: stubs.open,
        addEventListener: sinon.stub()
      });


      $provide.value('routing', {
        goToSpace: stubs.goToSpace,
        goToOrganization: stubs.goToOrganization,
        getSpaceId: stubs.routingSpaceId,
        getRoute: stubs.getRoute
      });

      $provide.value('$location', {
        path: stubs.path
      });

      $provide.value('client', {
        newSpace: stubs.newSpace
      });

      $provide.value('modalDialog', {
        open: stubs.dialog
      });

      $provide.value('presence', {
        isActive: stubs.presenceActive
      });

      $provide.value('ReloadNotification', {
        trigger: stubs.trigger,
        gatekeeperErrorHandler: stubs.gatekeeperErrorHandler
      });

      $provide.value('revision', {
        hasNewVersion: stubs.hasNewVersion
      });

      $provide.value('enforcements', {
        determineEnforcement: stubs.enforcement,
        setSpaceContext: stubs.setSpaceContext
      });

      $provide.value('reasonsDenied', stubs.reasons);

    });
    inject(function ($controller, $rootScope, $q, $injector){
      notification = $injector.get('notification');
      scope = $rootScope.$new();
      clientController = $controller('ClientController', {$scope: scope});
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
      sinon.assert.calledWith(stubs.auxPanel, true, {});
    });
  });

  it('space switcher analytics tracking', function () {
    scope.clickedSpaceSwitcher();
    sinon.assert.called(stubs.track);
  });

  describe('on space and token lookup updates', function () {
    beforeEach(inject(function (authentication) {
      stubs.spaceId.returns(123);
      stubs.hasSpace.withArgs(123).returns(true);
      scope.spaceContext.space = _.extend(scope.spaceContext.space, {cloned: true});
      authentication.tokenLookup = {};
      scope.$digest();
    }));

    it('token lookup is called', function () {
      sinon.assert.called(stubs.authorizationTokenLookup);
    });

    it('space id is called', function () {
      sinon.assert.called(stubs.spaceId);
    });

    it('hasSpace is called', function () {
      sinon.assert.called(stubs.hasSpace);
    });

    it('setSpace is called', function () {
      sinon.assert.calledWith(stubs.setSpace, scope.spaceContext.space);
    });
  });

  it('hideTabBar is true if no tabs are visible', function () {
    stubs.numVisible.returns(0);
    expect(scope.hideTabBar()).toBeTruthy();
  });

  it('hideTabBar is false if no tabs are visible', function () {
    stubs.numVisible.returns(1);
    expect(scope.hideTabBar()).toBeFalsy();
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
        sinon.assert.notCalled(stubs.track);
      });

      it('dont route to another space', function () {
        sinon.assert.notCalled(stubs.goToSpace);
      });
    });

    describe('if we are selecting the current space but in account section', function () {
      beforeEach(function () {
        idStub.returns(123);
        scope.locationInAccount = true;
        scope.selectSpace(space);
      });

      it('tracks analytics', function () {
        sinon.assert.called(stubs.track);
      });

      it('tracks the space properties', function () {
        expect(stubs.track.args[0][1]).toEqual({spaceId: 123, spaceName: 'testspace'});
      });

      it('route to another space', function () {
        sinon.assert.calledWith(stubs.goToSpace, space);
      });
    });

    describe('if we are selecting a different space', function () {
      beforeEach(function () {
        idStub.returns(456);
        scope.selectSpace(space);
      });

      it('tracks analytics', function () {
        sinon.assert.called(stubs.track);
      });

      it('tracks the space properties', function () {
        expect(stubs.track.args[0][1]).toEqual({spaceId: 456, spaceName: 'testspace'});
      });

      it('route to another space', function () {
        sinon.assert.calledWith(stubs.goToSpace, space);
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
          sinon.assert.notCalled(stubs.track);
        });

      it('does not route to another space', function () {
        sinon.assert.notCalled(stubs.goToOrganization);
      });

    });

    describe('can select org', function() {
      beforeEach(function() {
        scope.canSelectOrg.returns(true);
        scope.selectOrg('1234');
      });

      it('tracks analytics', function () {
          sinon.assert.called(stubs.track);
        });

      it('tracks the org properties', function () {
        expect(stubs.track.args[0][1]).toEqual({
          organizationId: '1234', organizationName: 'orgname'
        });
      });

      it('route to another space', function () {
        sinon.assert.calledWith(stubs.goToOrganization, '1234', true);
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
        sinon.assert.notCalled(stubs.setSpace);
      });
    });

    describe('does not change route to the same space', function () {
      beforeEach(function () {
        scope.spaces = [];
        childScope.$emit('$routeChangeSuccess', {params: {spaceId: 123}, viewType: null});
      });

      it('sets no space data on analytics', function () {
        sinon.assert.notCalled(stubs.setSpace);
      });

      it('location in account flag is false', function() {
        expect(scope.locationInAccount).toBeFalsy();
      });
    });

    describe('changing route to a different space', function () {
      beforeEach(function () {
        scope.spaces = [{getId: idStub}];
        idStub.returns(456);
        childScope.$emit('$routeChangeSuccess', {params: {spaceId: 456}});
      });

      it('gets the space id', function () {
        sinon.assert.called(idStub);
      });

      it('space data is set on analytics', function () {
        sinon.assert.calledWith(stubs.setSpace, scope.spaces[0]);
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
      stubs.routingSpaceId.returns(123);
      scope.$digest();
      expect(scope.spacesByOrg).toEqual({
        132: [scope.spaces[0], scope.spaces[1]],
        456: [scope.spaces[2]]
      });
    });

    it('space data is set on analytics', function () {
      stubs.routingSpaceId.returns(456);
      scope.$digest();
      sinon.assert.calledWith(stubs.setSpace, scope.spaces[1]);
    });

    it('redirects to a non existent space and defaults to first space', function () {
      stubs.routingSpaceId.returns(789);
      scope.$digest();
      sinon.assert.calledWith(stubs.goToSpace, scope.spaces[0]);
    });

    it('redirects to a space with no routing id and defaults to first space', function () {
      stubs.routingSpaceId.returns();
      stubs.getRoute.returns({
        root: true
      });
      scope.$digest();
      sinon.assert.calledWith(stubs.goToSpace, scope.spaces[0]);
    });

    describe('no space id for redirect provided and not redirecting to root', function () {
      beforeEach(function () {
        stubs.getRoute.returns({
          root: false
        });
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        sinon.assert.notCalled(stubs.goToSpace);
      });

      it('doesnt set analytics data', function () {
        sinon.assert.notCalled(stubs.setSpace);
      });

      it('doesnt set a location path', function () {
        sinon.assert.notCalled(stubs.path);
      });
    });

    describe('redirects to the current space', function () {
      beforeEach(function () {
        scope.spaces = [];
        stubs.routingSpaceId.returns(321);
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        sinon.assert.notCalled(stubs.goToSpace);
      });

      it('sets analytics data', function () {
        sinon.assert.called(stubs.setSpace);
      });

      it('sets a location path', function () {
        sinon.assert.called(stubs.path);
      });
    });

    describe('redirects to the current space', function () {
      beforeEach(function () {
        stubs.routingSpaceId.returns(321);
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        sinon.assert.notCalled(stubs.goToSpace);
      });

      it('doesnt set analytics data', function () {
        sinon.assert.notCalled(stubs.setSpace);
      });
    });

    describe('no space can be found', function () {
      beforeEach(function () {
        stubs.routingSpaceId.returns(321);
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        sinon.assert.notCalled(stubs.goToSpace);
      });

      it('doesnt set analytics data', function () {
        sinon.assert.notCalled(stubs.setSpace);
      });
    });
  });

  describe('calls logout', function () {
    beforeEach(function () {
      scope.logout();
    });

    it('tracks analytics event', function () {
      sinon.assert.called(stubs.track);
    });

    it('logs out through authentication', function () {
      sinon.assert.called(stubs.logout);
    });
  });

  describe('open support', function () {
    beforeEach(function () {
      scope.openSupport();
    });

    it('opens new window', function () {
      sinon.assert.called(stubs.open);
    });

    it('gets support url', function () {
      sinon.assert.called(stubs.supportUrl);
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
        sinon.assert.called(stubs.goodbye);
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
          sinon.assert.calledWith(stubs.updateTokenLookup, token);
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
          stubs.newSpace.returns(mockSpace);
          childScope.$emit('iframeMessage', data);
        });

        it('sets token lookup', function() {
          sinon.assert.calledWith(stubs.updateTokenLookup, token);
        });

        it('sets user', function() {
          expect(scope.user).toBe(user);
        });

        it('wraps the space', function() {
          sinon.assert.calledWith(stubs.newSpace, token.spaces[0]);
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
        sinon.assert.calledWith(stubs.path, '/foobar/baz');
      });
    });

    describe('location update', function () {
      beforeEach(function () {
        data = {
          type: 'location',
          action: 'update',
          path: '/foobar/baz'
        };
        scope.performTokenLookup = sinon.stub();
        childScope.$emit('iframeMessage', data);
      });

      it('performs no token lookup', function() {
        sinon.assert.notCalled(scope.performTokenLookup);
      });
    });

    describe('space deleted', function () {
      beforeEach(function () {
        data = {
          type: 'space',
          action: 'delete',
        };
        scope.performTokenLookup = sinon.stub();
        childScope.$emit('iframeMessage', data);
      });

      it('performs token lookup', function() {
        sinon.assert.called(scope.performTokenLookup);
      });
    });


    describe('for other messages', function () {
      beforeEach(function () {
        data = {};
        scope.performTokenLookup = sinon.stub();
        childScope.$emit('iframeMessage', data);
      });

      it('performs token lookup', function() {
        sinon.assert.called(scope.performTokenLookup);
      });
    });

  });

  it('tracks profile button click event', function () {
    scope.clickedProfileButton();
    sinon.assert.called(stubs.track);
  });

  describe('redirects to profile', function () {
    beforeEach(function() {
      scope.goToAccount();
    });

    it('sets the path', function() {
      sinon.assert.calledWith(stubs.path, '/account/profile/user');
    });

    it('sets account section flag', function() {
      scope.$emit('$routeChangeSuccess', {viewType: 'account'});
      expect(scope.locationInAccount).toBeTruthy();
    });
  });

  describe('redirects to profile with a suffix', function () {
    beforeEach(function() {
      scope.goToAccount('section');
    });

    it('sets the path', function() {
      sinon.assert.calledWith(stubs.path, '/account/section');
    });
  });

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
      stubs.getTokenLookup.returns(tokenDeferred.promise);

      scope.spaces = [{
        getId: sinon.stub(),
        update: sinon.stub()
      }];
      scope.spaces[0].getId.returns(123);

      scope.updateSpaces = sinon.stub();
      scope.performTokenLookup();
    }));

    it('expect getTokenLookup to be called', function () {
      sinon.assert.called(stubs.getTokenLookup);
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
      stubs.dialog.returns({promise: $q.when()});
      tokenDeferred.reject({statusCode: 401});
      scope.$apply();
      sinon.assert.called(stubs.logout);
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
        stubs.can.returns(true);
        expect(scope.canCreateSpace()).toBeTruthy();
      });

      describe('if authorization does not allow', function() {
        var result;
        beforeEach(function() {
          scope.canCreateSpaceInAnyOrg.returns(true);
          stubs.can.returns(false);
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
        sinon.assert.calledWith(stubs.organization, 'orgid');
      });

      it('checks for permission on organization', function() {
        sinon.assert.called(stubs.can);
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
        stubs.enforcement.returns({});
        scope.checkForEnforcements(args, {});
      });

      it('enforcement is determined', function () {
        sinon.assert.called(stubs.enforcement);
      });

      it('reasons are determined', function () {
        sinon.assert.called(stubs.reasons);
      });

      it('event is broadcast', function () {
        sinon.assert.called(broadcastStub);
      });
    });

    describe('if there are no reasons', function () {
      beforeEach(function () {
        stubs.enforcement.returns(false);
        scope.checkForEnforcements(args, {});
      });

      it('enforcement is determined', function () {
        sinon.assert.called(stubs.enforcement);
      });

      it('reasons are determined', function () {
        sinon.assert.called(stubs.reasons);
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
      stubs.dialog.returns({promise: $q.when()});
    }));
    it('opens dialog', function () {
      scope.showCreateSpaceDialog();
      sinon.assert.called(stubs.dialog);
    });

    it('tracks analytics event', function () {
      scope.showCreateSpaceDialog();
      sinon.assert.called(stubs.track);
    });

    describe('with an organizationId', function () {
      it('displays that organization first in the dropdown', function () {
        scope.showCreateSpaceDialog('def');
        expect(stubs.dialog.args[0][0].scope.organizations[1].sys.id).toBe('def');
      });
    });

    describe('without an organizationId', function () {
      it('displays that organization first in the dropdown', function () {
        scope.showCreateSpaceDialog();
        expect(stubs.dialog.args[0][0].scope.organizations[0].sys.id).toBe('abc');
      });
    });
  });

  describe('initializes client', function () {
    var thenStub, catchStub, revisionCatchStub;
    beforeEach(function () {
      revisionCatchStub = sinon.stub();
      stubs.hasNewVersion.returns({catch: revisionCatchStub});
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
        sinon.assert.called(stubs.setUserData);
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
          sinon.assert.called(stubs.hasNewVersion);
        });

        it('broadcasts event if new version is available', function () {
          sinon.assert.called(broadcastStub);
        });
      });


      describe('presence timeout is fired', function () {
        var broadcastStub;
        beforeEach(inject(function ($rootScope) {
          stubs.presenceActive.returns(true);
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
          sinon.assert.called(stubs.presenceActive);
        });

        it('checks for new version', function () {
          sinon.assert.called(stubs.hasNewVersion);
        });

        it('reload is triggered if lookup fails', function () {
          sinon.assert.called(stubs.trigger);
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
        sinon.assert.called(stubs.gatekeeperErrorHandler);
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
        sinon.assert.called(stubs.setUserData);
        sinon.assert.called(stubs.enableAnalytics);
        sinon.assert.called(this.logger.enable);
      });

      describe('when analytics are disallowed', function() {
        beforeEach(function() {
          stubs.shouldAllowAnalytics.returns(false);
        });

        it('should not set or enable anything', function() {
          scope.$digest();
          sinon.assert.notCalled(stubs.setUserData);
          sinon.assert.called(stubs.disableAnalytics);
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
