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
        'goToSpace',
        'routingSpaceId',
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
        'can'
      ]);

      $controllerProvider.register('TrialWatchController', function () {});

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
        error: stubs.notificationError
      });

      $provide.value('routing', {
        goToSpace: stubs.goToSpace,
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
        trigger: stubs.trigger
      });

      $provide.value('revision', {
        hasNewVersion: stubs.hasNewVersion
      });

      $provide.value('enforcements', {
        determineEnforcement: stubs.enforcement
      });

      $provide.value('reasonsDenied', stubs.reasons);

    });
    inject(function ($controller, $rootScope, tutorial, $q){
      tutorial.start.returns($q.when());
      scope = $rootScope.$new();
      clientController = $controller('ClientCtrl', {$scope: scope});
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
      expect(stubs.notificationError).toBeCalled();
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
      idStub.returns(456);
    });

    describe('no spaces exist', function () {
      beforeEach(function () {
        scope.spaces = null;
        childScope.$emit('$routeChangeSuccess');
      });

      it('sets no space data on analytics', function () {
        expect(stubs.setSpaceData).not.toBeCalled();
      });
    });

    describe('changing route but not to the same space', function () {
      beforeEach(function () {
        scope.spaces = [];
        childScope.$emit('$routeChangeSuccess', {params: {spaceId: 123}});
      });

      it('sets no space data on analytics', function () {
        expect(stubs.setSpaceData).not.toBeCalled();
      });
    });

    describe('changing route but to a different space', function () {
      beforeEach(function () {
        scope.spaces = [{getId: idStub}];
        childScope.$emit('$routeChangeSuccess', {params: {spaceId: 456}});
      });

      it('gets the space id', function () {
        expect(idStub).toBeCalled();
      });

      it('space data is set on analytics', function () {
        expect(stubs.setSpaceData).toBeCalledWith(scope.spaces[0]);
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
    var childScope, data;
    beforeEach(function () {
      childScope = scope.$new();
    });

    describe('space updates', function () {
      beforeEach(function () {
        data = {
          type: 'space',
          action: 'update',
          resource: {
            newproperty: 'value'
          }
        };
        childScope.$emit('iframeMessage', data);
      });

      it('sets new property on space data', function () {
        expect(scope.spaceContext.space.data.newproperty).toBeDefined();
      });
    });

    describe('user cancellation', function () {
      beforeEach(function () {
        data = {
          type: 'UserCancellation',
          action: 'create'
        };
        childScope.$emit('iframeMessage', data);
      });

      it('calls authentication goodbye', function () {
        expect(stubs.goodbye).toBeCalled();
      });
    });

    describe('flash message', function () {

      it('calls error notification', function () {
        data = {
          type: 'flash',
          resource: {
            type: 'error',
            message: 'hai'
          }
        };
        childScope.$emit('iframeMessage', data);
        expect(stubs.notificationError).toBeCalledWith('hai');
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

    describe('performs token lookup', function () {
      beforeEach(function () {
        data = {};
        scope.performTokenLookup = sinon.stub();
        childScope.$emit('iframeMessage', data);
      });

      it('calls token lookup', function () {
        expect(scope.performTokenLookup).toBeCalled();
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
        expect(stubs.path).toBeCalledWith('/foobar/baz');
      });

      it('should change the location to whatever was requested', function () {

      });
    });

    describe('requests create Space dialog', function () {
      beforeEach(function () {
        data = {
          type: 'space',
          action: 'new',
          organizationId: '123abc'
        };
        childScope.$emit('iframeMessage', data);
        expect(stubs.dialog).toBeCalledWith('123abc');
      });
    });

  });

  it('tracks profile button click event', function () {
    scope.clickedProfileButton();
    expect(stubs.track).toBeCalled();
  });

  it('redirects to profile', function () {
    scope.goToAccount();
    expect(stubs.path).toBeCalledWith('/account/profile/user');
  });

  it('redirects to profile with a suffix', function () {
    scope.goToAccount('section');
    expect(stubs.path).toBeCalledWith('/account/section');
  });

  describe('performs token lookup', function () {
    beforeEach(function () {
      var thenStub = sinon.stub();
      thenStub.callsArgWith(0, {
        sys: {
          createdBy: 'user'
        },
        spaces: ['space']
      });
      stubs.getTokenLookup.returns({
        then: thenStub
      });
      scope.updateSpaces = sinon.stub();
      scope.performTokenLookup();
    });

    it('expect getTokenLookup to be called', function () {
      expect(stubs.getTokenLookup).toBeCalled();
    });

    it('user is set to the provided one', function () {
      expect(scope.user).toEqual('user');
    });

    it('spaces are updated', function () {
      expect(scope.updateSpaces).toBeCalledWith(['space']);
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
        expect(stubs.notificationError).toBeCalled();
      });

      it('user is logged out', function () {
        expect(stubs.logout).toBeCalled();
      });
    });

  });

  describe('organizations on the scope', function() {
    it('are not set', function() {
      expect(scope.organizations).toBeNull();
    });

    it('are set', function() {
      var org1 = {org1: true};
      var org2 = {org2: true};
      var org3 = {org3: true};
      scope.user = {
        organizationMemberships: [
          {organization: org1},
          {organization: org2},
          {organization: org3},
        ]
      };
      scope.$digest();

      expect(scope.organizations).toEqual([
        org1, org2, org3
      ]);
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
