'use strict';

describe('Client Controller', function () {
  var clientController, scope;
  var numVisibleStub, spaceIdStub, auxPanelStub, trackStub;
  var authorizationTokenLookupStub, authenticationTokenLookupStub, getTokenLookupStub;
  var setSpaceStub, hasSpaceStub, notificationErrorStub, notificationInfoStub;
  var goToSpaceStub, routingSpaceIdStub, setSpaceDataStub, getRouteStub, pathStub;
  var logoutStub, goodbyeStub, supportUrlStub, openStub, wrapSpaceStub;
  var dialogStub, loginTrackStub, presenceActiveStub, triggerStub, hasNewVersionStub;
  var tutorialStartStub, tutorialSeenStub;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
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
        'hasNewVersion'
      ]);
      $provide.factory('SpaceContext', function () {
        return function(){
          return {
            space: {
              getId: stubs.spaceId,
              data: {}
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
          hasSpace: stubs.hasSpace
        }
      });

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


    });
    inject(function ($controller, $rootScope){
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
      expect(stubs.auxPanel.calledWith(true, {})).toBeTruthy();
    });
  });

  it('space switcher analytics tracking', function () {
    scope.clickedSpaceSwitcher();
    expect(stubs.track.called).toBeTruthy();
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
      expect(stubs.authorizationTokenLookup.called).toBeTruthy();
    });

    it('space id is called', function () {
      expect(stubs.spaceId.called).toBeTruthy();
    });

    it('hasSpace is called', function () {
      expect(stubs.hasSpace.called).toBeTruthy();
    });

    it('setSpace is called', function () {
      expect(stubs.setSpace.calledWith(scope.spaceContext.space)).toBeTruthy();
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
      expect(stubs.notificationError.called).toBeTruthy();
    });

    describe('if we are selecting the current space', function () {
      beforeEach(function () {
        idStub.returns(123);
        scope.selectSpace(space);
      });

      it('dont track analytics', function () {
        expect(stubs.track.called).toBeFalsy();
      });

      it('dont route to another space', function () {
        expect(stubs.goToSpace.called).toBeFalsy();
      });
    });

    describe('if we are selecting a different space', function () {
      beforeEach(function () {
        idStub.returns(456);
        scope.selectSpace(space);
      });

      it('tracks analytics', function () {
        expect(stubs.track.called).toBeTruthy();
      });

      it('tracks the space properties', function () {
        expect(stubs.track.args[0][1]).toEqual({spaceId: 456, spaceName: 'testspace'});
      });

      it('route to another space', function () {
        expect(stubs.goToSpace.calledWith(space)).toBeTruthy();
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
        expect(stubs.setSpaceData.called).toBeFalsy();
      });
    });

    describe('changing route but not to the same space', function () {
      beforeEach(function () {
        scope.spaces = [];
        childScope.$emit('$routeChangeSuccess', {params: {spaceId: 123}});
      });

      it('sets no space data on analytics', function () {
        expect(stubs.setSpaceData.called).toBeFalsy();
      });
    });

    describe('changing route but to a different space', function () {
      beforeEach(function () {
        scope.spaces = [{getId: idStub}];
        childScope.$emit('$routeChangeSuccess', {params: {spaceId: 456}});
      });

      it('gets the space id', function () {
        expect(idStub.called).toBeTruthy();
      });

      it('space data is set on analytics', function () {
        expect(stubs.setSpaceData.calledWith(scope.spaces[0])).toBeTruthy();
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
        {getId: idStub1},
        {getId: idStub2},
        scope.spaceContext.space
      ];
    });

    it('space data is set on analytics', function () {
      stubs.routingSpaceId.returns(456);
      scope.$digest();
      expect(stubs.setSpaceData.calledWith(scope.spaces[1])).toBeTruthy();
    });

    it('redirects to a non existent space and defaults to first space', function () {
      stubs.routingSpaceId.returns(789);
      scope.$digest();
      expect(stubs.goToSpace.calledWith(scope.spaces[0])).toBeTruthy();
    });

    it('redirects to a space with no routing id and defaults to first space', function () {
      stubs.routingSpaceId.returns();
      stubs.getRoute.returns({
        root: true
      });
      scope.$digest();
      expect(stubs.goToSpace.calledWith(scope.spaces[0])).toBeTruthy();
    });

    describe('no space id for redirect provided and not redirecting to root', function () {
      beforeEach(function () {
        stubs.getRoute.returns({
          root: false
        });
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        expect(stubs.goToSpace.called).toBeFalsy();
      });

      it('doesnt set analytics data', function () {
        expect(stubs.setSpaceData.called).toBeFalsy();
      });

      it('doesnt set a location path', function () {
        expect(stubs.path.called).toBeFalsy();
      });
    });

    describe('redirects to the current space', function () {
      beforeEach(function () {
        scope.spaces = [];
        stubs.routingSpaceId.returns(321);
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        expect(stubs.goToSpace.called).toBeFalsy();
      });

      it('sets analytics data', function () {
        expect(stubs.setSpaceData.called).toBeTruthy();
      });

      it('sets a location path', function () {
        expect(stubs.path.called).toBeTruthy();
      });
    });

    describe('redirects to the current space', function () {
      beforeEach(function () {
        stubs.routingSpaceId.returns(321);
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        expect(stubs.goToSpace.called).toBeFalsy();
      });

      it('doesnt set analytics data', function () {
        expect(stubs.setSpaceData.called).toBeFalsy();
      });
    });

    describe('no space can be found', function () {
      beforeEach(function () {
        stubs.routingSpaceId.returns(321);
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        expect(stubs.goToSpace.called).toBeFalsy();
      });

      it('doesnt set analytics data', function () {
        expect(stubs.setSpaceData.called).toBeFalsy();
      });
    });
  });

  describe('calls logout', function () {
    beforeEach(function () {
      scope.logout();
    });

    it('tracks analytics event', function () {
      expect(stubs.track.called).toBeTruthy();
    });

    it('logs out through authentication', function () {
      expect(stubs.logout.called).toBeTruthy();
    });
  });

  describe('open support', function () {
    beforeEach(function () {
      scope.openSupport();
    });

    it('opens new window', function () {
      expect(stubs.open.called).toBeTruthy();
    });

    it('gets support url', function () {
      expect(stubs.supportUrl.called).toBeTruthy();
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
        expect(stubs.goodbye.called).toBeTruthy();
      });
    });

    /*
    describe('user updates', function () {
      beforeEach(inject(function (authentication) {
        scope.user = {};
        data = {
          type: 'user',
          action: 'update',
          resource: {
            newproperty: 'value'
          }
        };
        authentication.tokenLookup = {
          sys: {createdBy: 'lookedupuser' }
        };
        scope.updateSpaces = sinon.stub();
        childScope.$emit('iframeMessage', data);
      }));

      it('sets new property on user data', function () {
        expect(scope.user.newproperty).toBeDefined();
      });

      it('calls auth token lookup', function () {
        expect(stubs.authenticationTokenLookup).toBeTruthy();
      });

      it('sets user to looked up user', function () {
        expect(scope.user).toBe('lookedupuser');
      });

      it('updates spaces', function () {
        expect(scope.updateSpaces.called).toBeTruthy();
      });
    });
   */

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
        expect(stubs.notificationError.calledWith('hai')).toBeTruthy();
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
        expect(stubs.notificationInfo.calledWith('hai')).toBeTruthy();
      });
    });

    describe('performs token lookup', function () {
      beforeEach(function () {
        data = {};
        scope.performTokenLookup = sinon.stub();
        childScope.$emit('iframeMessage', data);
      });

      it('calls token lookup', function () {
        expect(scope.performTokenLookup.called).toBeTruthy();
      });
    });

  });

  it('tracks profile button click event', function () {
    scope.clickedProfileButton();
    expect(stubs.track.called).toBeTruthy();
  });

  it('redirects to profile', function () {
    scope.goToProfile();
    expect(stubs.path.calledWith('/profile/user')).toBeTruthy();
  });

  it('redirects to profile with a suffix', function () {
    scope.goToProfile('derp');
    expect(stubs.path.calledWith('/profile/derp')).toBeTruthy();
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
      expect(stubs.getTokenLookup.called).toBeTruthy();
    });

    it('user is set to the provided one', function () {
      expect(scope.user).toEqual('user');
    });

    it('spaces are updated', function () {
      expect(scope.updateSpaces.calledWith(['space'])).toBeTruthy();
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
      expect(updateStub.calledTwice).toBeTruthy();
    });

    it('update is called with first raw space', function () {
      expect(updateStub.args[0][0]).toEqual(spaces[0]);
    });

    it('update is called with second raw space', function () {
      expect(updateStub.args[1][0]).toEqual(spaces[1]);
    });

    it('new space is wrapped', function () {
      expect(stubs.wrapSpace.calledWith(spaces[2])).toBeTruthy();
    });

    it('third space has a save method', function () {
      expect(scope.spaces[2].save).toBeDefined();
    });
  });

  describe('shows create space dialog', function () {
    beforeEach(function () {
      scope.showCreateSpaceDialog();
    });

    it('opens dialog', function () {
      expect(stubs.dialog.called).toBeTruthy();
    });

    it('tracks analytics event', function () {
      expect(stubs.track.called).toBeTruthy();
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
      expect(scope.performTokenLookup.called).toBeTruthy();
    });

    describe('if lookup succeeds', function () {
      beforeEach(function () {
        jasmine.clock().install();
        thenStub.callsArg(0);
        scope.user = {
          sys: {}
        };
        scope.spaces = [{}];
        scope.initClient();
      });

      afterEach(function () {
        jasmine.clock().uninstall();
      });

      it('tracks login', function () {
        expect(stubs.loginTrack.called).toBeTruthy();
      });

      it('tutorial seen check is called', function () {
        expect(stubs.tutorialSeen.called).toBeTruthy();
      });

      it('tutorial start is called', function () {
        expect(stubs.tutorialStart.called).toBeTruthy();
      });

      describe('fires an initial version check', function () {
        var broadcastStub;
        beforeEach(inject(function ($rootScope) {
          broadcastStub = sinon.stub($rootScope, '$broadcast');
          revisionCatchStub.callsArgWith(0, 'APP_REVISION_CHANGED');
          jasmine.clock().tick(5000);
        }));

        afterEach(function () {
          broadcastStub.restore();
        });

        it('checks for new version', function () {
          expect(stubs.hasNewVersion.called).toBeTruthy();
        });

        it('broadcasts event if new version is available', function () {
          expect(broadcastStub.called).toBeTruthy();
        });
      });


      describe('presence timeout is fired', function () {
        var broadcastStub;
        beforeEach(inject(function ($rootScope) {
          stubs.presenceActive.returns(true);
          catchStub.callsArg(0);
          broadcastStub = sinon.stub($rootScope, '$broadcast');
          revisionCatchStub.callsArgWith(0, 'APP_REVISION_CHANGED');
          jasmine.clock().tick(50*60*1000);
        }));

        afterEach(function () {
          broadcastStub.restore();
        });

        it('checks for presence', function () {
          expect(stubs.presenceActive.called).toBeTruthy();
        });

        it('checks for new version', function () {
          expect(stubs.hasNewVersion.called).toBeTruthy();
        });

        it('reload is triggered if lookup fails', function () {
          expect(stubs.trigger.called).toBeTruthy();
        });

        it('broadcasts event if new version is available', function () {
          expect(broadcastStub.called).toBeTruthy();
        });
      });

    });

    describe('if lookup fails', function () {
      beforeEach(function () {
        thenStub.callsArg(1);
        scope.initClient();
      });

      it('error notification shown', function () {
        expect(stubs.notificationError.called).toBeTruthy();
      });

      it('user is logged out', function () {
        expect(stubs.logout.called).toBeTruthy();
      });
    });

  });

});
