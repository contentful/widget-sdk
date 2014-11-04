'use strict';

describe('Client Controller', function () {
  var clientController, scope;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide, $controllerProvider) {
      stubs = $provide.makeStubs([
        'numVisible',
        'spaceId',
        'auxPanel',
        'track',
        'loginTrack',
        'authorizationTokenLookup',
        'authenticationTokenLookup',
        'getTokenLookup',
        'setSpace',
        'hasSpace',
        'notificationInfo',
        'notificationError',
        'notificationWarn',
        'gatekeeperErrorHandler',
        'goToSpace',
        'goToOrganization',
        'routingSpaceId',
        'setUserData',
        'setSpaceData',
        'getRoute',
        'path',
        'logout',
        'goodbye',
        'supportUrl',
        'open',
        'wrapSpace',
        'dialog',
        'tutorialStart',
        'tutorialSeen',
        'presenceActive',
        'trigger',
        'hasNewVersion',
        'enforcement',
        'reasons',
        'organization',
        'can',
        'setSpaceContext'
      ]);

      $controllerProvider.register('TrialWatchController', angular.noop);

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
        toggleAuxPanel: stubs.auxPanel,
        track: stubs.track,
        setSpaceData: stubs.setSpaceData,
        setUserData: stubs.setUserData,
        login: stubs.loginTrack
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

      $provide.value('authentication', {
        logout: stubs.logout,
        supportUrl: stubs.supportUrl,
        goodbye: stubs.goodbye,
        setTokenLookup: stubs.authenticationTokenLookup,
        getTokenLookup: stubs.getTokenLookup
      });

      $provide.value('$window', {
        open: stubs.open,
        addEventListener: sinon.stub()
      });


      $provide.value('notification', {
        info: stubs.notificationInfo,
        error: stubs.notificationError,
        warn: stubs.notificationWarn
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
        wrapSpace: stubs.wrapSpace
      });

      $provide.value('modalDialog', {
        open: stubs.dialog
      });

      $provide.value('tutorial', {
        start: stubs.tutorialStart,
        getSeen: stubs.tutorialSeen
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
    inject(function ($controller, $rootScope, tutorial, $q){
      tutorial.start.returns($q.when());
      scope = $rootScope.$new();
      clientController = $controller('ClientController', {$scope: scope});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

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
      expect(stubs.auxPanel).toBeCalledWith(true, {});
    });
  });

  it('space switcher analytics tracking', function () {
    scope.clickedSpaceSwitcher();
    expect(stubs.track).toBeCalled();
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
      expect(stubs.authorizationTokenLookup).toBeCalled();
    });

    it('space id is called', function () {
      expect(stubs.spaceId).toBeCalled();
    });

    it('hasSpace is called', function () {
      expect(stubs.hasSpace).toBeCalled();
    });

    it('setSpace is called', function () {
      expect(stubs.setSpace).toBeCalledWith(scope.spaceContext.space);
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
      expect(stubs.notificationWarn).toBeCalled();
    });

    describe('if we are selecting the current space', function () {
      beforeEach(function () {
        idStub.returns(123);
        scope.selectSpace(space);
      });

      it('dont track analytics', function () {
        expect(stubs.track).not.toBeCalled();
      });

      it('dont route to another space', function () {
        expect(stubs.goToSpace).not.toBeCalled();
      });
    });

    describe('if we are selecting the current space but in account section', function () {
      beforeEach(function () {
        idStub.returns(123);
        scope.locationInAccount = true;
        scope.selectSpace(space);
      });

      it('tracks analytics', function () {
        expect(stubs.track).toBeCalled();
      });

      it('tracks the space properties', function () {
        expect(stubs.track.args[0][1]).toEqual({spaceId: 123, spaceName: 'testspace'});
      });

      it('route to another space', function () {
        expect(stubs.goToSpace).toBeCalledWith(space);
      });
    });

    describe('if we are selecting a different space', function () {
      beforeEach(function () {
        idStub.returns(456);
        scope.selectSpace(space);
      });

      it('tracks analytics', function () {
        expect(stubs.track).toBeCalled();
      });

      it('tracks the space properties', function () {
        expect(stubs.track.args[0][1]).toEqual({spaceId: 456, spaceName: 'testspace'});
      });

      it('route to another space', function () {
        expect(stubs.goToSpace).toBeCalledWith(space);
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
          expect(stubs.track).not.toBeCalled();
        });

      it('does not route to another space', function () {
        expect(stubs.goToOrganization).not.toBeCalled();
      });

    });

    describe('can select org', function() {
      beforeEach(function() {
        scope.canSelectOrg.returns(true);
        scope.selectOrg('1234');
      });

      it('tracks analytics', function () {
          expect(stubs.track).toBeCalled();
        });

      it('tracks the org properties', function () {
        expect(stubs.track.args[0][1]).toEqual({
          organizationId: '1234', organizationName: 'orgname'
        });
      });

      it('route to another space', function () {
        expect(stubs.goToOrganization).toBeCalledWith('1234', true);
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
        expect(stubs.setSpaceData).not.toBeCalled();
      });
    });

    describe('does not change route to the same space', function () {
      beforeEach(function () {
        scope.spaces = [];
        childScope.$emit('$routeChangeSuccess', {params: {spaceId: 123}, viewType: null});
      });

      it('sets no space data on analytics', function () {
        expect(stubs.setSpaceData).not.toBeCalled();
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
        expect(idStub).toBeCalled();
      });

      it('space data is set on analytics', function () {
        expect(stubs.setSpaceData).toBeCalledWith(scope.spaces[0]);
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
      expect(stubs.setSpaceData).toBeCalledWith(scope.spaces[1]);
    });

    it('redirects to a non existent space and defaults to first space', function () {
      stubs.routingSpaceId.returns(789);
      scope.$digest();
      expect(stubs.goToSpace).toBeCalledWith(scope.spaces[0]);
    });

    it('redirects to a space with no routing id and defaults to first space', function () {
      stubs.routingSpaceId.returns();
      stubs.getRoute.returns({
        root: true
      });
      scope.$digest();
      expect(stubs.goToSpace).toBeCalledWith(scope.spaces[0]);
    });

    describe('no space id for redirect provided and not redirecting to root', function () {
      beforeEach(function () {
        stubs.getRoute.returns({
          root: false
        });
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        expect(stubs.goToSpace).not.toBeCalled();
      });

      it('doesnt set analytics data', function () {
        expect(stubs.setSpaceData).not.toBeCalled();
      });

      it('doesnt set a location path', function () {
        expect(stubs.path).not.toBeCalled();
      });
    });

    describe('redirects to the current space', function () {
      beforeEach(function () {
        scope.spaces = [];
        stubs.routingSpaceId.returns(321);
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        expect(stubs.goToSpace).not.toBeCalled();
      });

      it('sets analytics data', function () {
        expect(stubs.setSpaceData).toBeCalled();
      });

      it('sets a location path', function () {
        expect(stubs.path).toBeCalled();
      });
    });

    describe('redirects to the current space', function () {
      beforeEach(function () {
        stubs.routingSpaceId.returns(321);
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        expect(stubs.goToSpace).not.toBeCalled();
      });

      it('doesnt set analytics data', function () {
        expect(stubs.setSpaceData).not.toBeCalled();
      });
    });

    describe('no space can be found', function () {
      beforeEach(function () {
        stubs.routingSpaceId.returns(321);
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        expect(stubs.goToSpace).not.toBeCalled();
      });

      it('doesnt set analytics data', function () {
        expect(stubs.setSpaceData).not.toBeCalled();
      });
    });
  });

  describe('calls logout', function () {
    beforeEach(function () {
      scope.logout();
    });

    it('tracks analytics event', function () {
      expect(stubs.track).toBeCalled();
    });

    it('logs out through authentication', function () {
      expect(stubs.logout).toBeCalled();
    });
  });

  describe('open support', function () {
    beforeEach(function () {
      scope.openSupport();
    });

    it('opens new window', function () {
      expect(stubs.open).toBeCalled();
    });

    it('gets support url', function () {
      expect(stubs.supportUrl).toBeCalled();
    });
  });

  describe('handle iframe messages', function () {
    var childScope, data, token, user, spaces;
    beforeEach(inject(function (authentication) {
      childScope = scope.$new();
      scope.updateSpaces = sinon.stub();
      scope.showCreateSpaceDialog = sinon.stub();

      token = {token: true};
      user = { user: true };
      spaces = [{space: true}];

      authentication.tokenLookup = {
        sys: {
          createdBy: user
        },
        spaces: spaces
      };
    }));


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
        expect(scope.showCreateSpaceDialog).toBeCalledWith('123abc');
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
        expect(stubs.goodbye).toBeCalled();
      });
    });

    describe('on token change', function() {
      beforeEach(function () {
        data = {
          token: token
        };
        childScope.$emit('iframeMessage', data);
      });

      it('sets token lookup', function() {
        expect(stubs.authenticationTokenLookup).toBeCalledWith(token);
      });

      it('sets user', function() {
        expect(scope.user).toBe(user);
      });

      it('updates spaces', function() {
        expect(scope.updateSpaces).toBeCalledWith(spaces);
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
        expect(stubs.notificationWarn).toBeCalledWith('hai');
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
        expect(stubs.notificationInfo).toBeCalledWith('hai');
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
        expect(stubs.path).toBeCalledWith('/foobar/baz');
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
        expect(scope.performTokenLookup).not.toBeCalled();
      });
    });


    describe('for other messages', function () {
      beforeEach(function () {
        data = {};
        scope.performTokenLookup = sinon.stub();
        childScope.$emit('iframeMessage', data);
      });

      it('performs token lookup', function() {
        expect(scope.performTokenLookup).toBeCalled();
      });
    });

  });

  it('tracks profile button click event', function () {
    scope.clickedProfileButton();
    expect(stubs.track).toBeCalled();
  });

  describe('redirects to profile', function () {
    beforeEach(function() {
      scope.goToAccount();
    });

    it('sets the path', function() {
      expect(stubs.path).toBeCalledWith('/account/profile/user');
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
      expect(stubs.path).toBeCalledWith('/account/section');
    });
  });

  describe('performs token lookup', function () {
    var $q;
    var tokenDeferred;
    var tokenLookup = { sys: { createdBy: 'user' }, spaces: ['space'] };
    beforeEach(inject(function ($injector) {
      $q = $injector.get('$q');
      tokenDeferred = $q.defer();
      stubs.getTokenLookup.returns(tokenDeferred.promise);
      scope.updateSpaces = sinon.stub();
      scope.performTokenLookup();
    }));

    it('expect getTokenLookup to be called', function () {
      expect(stubs.getTokenLookup).toBeCalled();
    });

    it('user is set to the provided one', function () {
      tokenDeferred.resolve(tokenLookup);
      scope.$apply();
      expect(scope.user).toEqual('user');
    });

    it('spaces are updated', function () {
      tokenDeferred.resolve(tokenLookup);
      scope.$apply();
      expect(scope.updateSpaces).toBeCalledWith(['space']);
    });

    it('logs the user out on error 401', function () {
      stubs.dialog.returns($q.when());
      tokenDeferred.reject({statusCode: 401});
      scope.$apply();
      expect(stubs.logout).toBeCalled();
    });
  });

  describe('updates existing spaces and a new space', function () {
    var idStub1, idStub2, updateStub, compareStub;
    var spaces;
    beforeEach(function () {
      idStub1 = sinon.stub();
      idStub2 = sinon.stub();
      updateStub = sinon.stub();
      compareStub = sinon.stub();
      scope.spaces = [
        {
          getId: idStub1,
          update: updateStub,
          data: {
            name: {
              name: 'space2',
              localeCompare: compareStub
            }
          }
        },
        {
          getId: idStub2,
          update: updateStub,
          data: {
            name: {
              name: 'space1',
              localeCompare: compareStub
            }
          }
        }
      ];
      scope.$digest();
      var newSpace = {
        data: {
          name: {
            name: 'space3',
            localeCompare: compareStub
          }
        }
      };
      stubs.wrapSpace.returns(newSpace);

      idStub1.returns(123);
      idStub2.returns(456);
      spaces = [
        {sys: {id: 123}},
        {sys: {id: 456}},
        {sys: {id: 789}}
      ];
      compareStub.withArgs(scope.spaces[1].data.name).returns(true);
      compareStub.withArgs(scope.spaces[0].data.name).returns(false);
      compareStub.withArgs(newSpace.data.name).returns(false);
      scope.updateSpaces(spaces);
    });

    it('update is called twice', function () {
      expect(updateStub).toBeCalledTwice();
    });

    it('update is called with first raw space', function () {
      expect(updateStub.args[0][0]).toEqual(spaces[0]);
    });

    it('update is called with second raw space', function () {
      expect(updateStub.args[1][0]).toEqual(spaces[1]);
    });

    it('new space is wrapped', function () {
      expect(stubs.wrapSpace).toBeCalledWith(spaces[2]);
    });

    it('third space has a save method', function () {
      expect(scope.spaces[2].save).toBeDefined();
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
          expect(scope.checkForEnforcements).toBeCalled();
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
        expect(stubs.organization).toBeCalledWith('orgid');
      });

      it('checks for permission on organization', function() {
        expect(stubs.can).toBeCalled();
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
        expect(stubs.enforcement).toBeCalled();
      });

      it('reasons are determined', function () {
        expect(stubs.reasons).toBeCalled();
      });

      it('event is broadcast', function () {
        expect(broadcastStub).toBeCalled();
      });
    });

    describe('if there are no reasons', function () {
      beforeEach(function () {
        stubs.enforcement.returns(false);
        scope.checkForEnforcements(args, {});
      });

      it('enforcement is determined', function () {
        expect(stubs.enforcement).toBeCalled();
      });

      it('reasons are determined', function () {
        expect(stubs.reasons).toBeCalled();
      });

      it('event is not broadcast', function () {
        expect(broadcastStub).not.toBeCalled();
      });

    });
  });


  describe('shows create space dialog', function () {
    beforeEach(function () {
      scope.organizations = [
        {sys: {id: 'abc'}},
        {sys: {id: 'def'}},
      ];
    });
    it('opens dialog', function () {
      scope.showCreateSpaceDialog();
      expect(stubs.dialog).toBeCalled();
    });

    it('tracks analytics event', function () {
      scope.showCreateSpaceDialog();
      expect(stubs.track).toBeCalled();
    });

    describe('with an organizationId', function () {
      it('displays that organization first in the dropdown', function () {
        scope.showCreateSpaceDialog('def');
        expect(stubs.dialog.args[0][0].scope.organizations[0].sys.id).toBe('def');
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
      expect(scope.performTokenLookup).toBeCalled();
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
        expect(stubs.loginTrack).toBeCalled();
      });

      it('tutorial seen check is called', function () {
        scope.initClient();
        expect(stubs.tutorialSeen).toBeCalled();
      });

      it('tutorial start is called', function () {
        scope.initClient();
        expect(stubs.tutorialStart).toBeCalled();
      });

      it('sets tutorial to be seen if tutorial fails to start', function () {
        inject(function (tutorial, $q) {
          tutorial.start.returns($q.when($q.reject()));
        });
        scope.initClient();
        expect(stubs.tutorialSeen).toBeCalled();
        expect(stubs.tutorialStart).toBeCalled();
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
          expect(stubs.hasNewVersion).toBeCalled();
        });

        it('broadcasts event if new version is available', function () {
          expect(broadcastStub).toBeCalled();
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
          expect(stubs.presenceActive).toBeCalled();
        });

        it('checks for new version', function () {
          expect(stubs.hasNewVersion).toBeCalled();
        });

        it('reload is triggered if lookup fails', function () {
          expect(stubs.trigger).toBeCalled();
        });

        it('broadcasts event if new version is available', function () {
          expect(broadcastStub).toBeCalled();
        });
      });

    });

    describe('if lookup fails', function () {
      beforeEach(function () {
        thenStub.callsArg(1);
        scope.initClient();
      });

      it('error notification shown', function () {
        expect(stubs.gatekeeperErrorHandler).toBeCalled();
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
        scope.$digest();
      });

      it('are set', function() {
        expect(scope.organizations).toEqual([
          org1, org2, org3
        ]);
      });

      it('sets analytics user data', function() {
        expect(stubs.setUserData).toBeCalled();
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

  it('should display an error if the tutorial fails to start', function () {
    inject(function ($q, tutorial) {
      tutorial.start.returns($q.when($q.reject()));
    });
    scope.startTutorial();
    scope.$apply();
    expect(stubs.notificationError).toBeCalled();
  });


});
