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

  beforeEach(function () {
    numVisibleStub = sinon.stub();
    spaceIdStub = sinon.stub();
    auxPanelStub = sinon.stub();
    trackStub = sinon.stub();
    loginTrackStub = sinon.stub();
    authorizationTokenLookupStub = sinon.stub();
    authenticationTokenLookupStub = sinon.stub();
    getTokenLookupStub = sinon.stub();
    setSpaceStub = sinon.stub();
    hasSpaceStub = sinon.stub();
    notificationInfoStub = sinon.stub();
    notificationErrorStub = sinon.stub();
    goToSpaceStub = sinon.stub();
    routingSpaceIdStub = sinon.stub();
    setSpaceDataStub = sinon.stub();
    getRouteStub = sinon.stub();
    pathStub = sinon.stub();
    logoutStub = sinon.stub();
    goodbyeStub = sinon.stub();
    supportUrlStub = sinon.stub();
    openStub = sinon.stub();
    wrapSpaceStub = sinon.stub();
    dialogStub = sinon.stub();
    tutorialStartStub = sinon.stub();
    tutorialSeenStub = sinon.stub();
    presenceActiveStub = sinon.stub();
    triggerStub = sinon.stub();
    hasNewVersionStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.factory('SpaceContext', function () {
        return function(){
          return {
            space: {
              getId: spaceIdStub,
              data: {}
            },
            tabList: {
              numVisible: numVisibleStub,
              current: {}
            }
          };
        };
      });

      $provide.value('analytics', {
        toggleAuxPanel: auxPanelStub,
        track: trackStub,
        setSpaceData: setSpaceDataStub,
        login: loginTrackStub
      });

      $provide.value('authorization', {
        setTokenLookup: authorizationTokenLookupStub,
        setSpace: setSpaceStub,
        authContext: {
          hasSpace: hasSpaceStub
        }
      });

      $provide.value('authentication', {
        logout: logoutStub,
        supportUrl: supportUrlStub,
        goodbye: goodbyeStub,
        setTokenLookup: authenticationTokenLookupStub,
        getTokenLookup: getTokenLookupStub
      });

      $provide.value('$window', {
        open: openStub,
        addEventListener: sinon.stub()
      });


      $provide.value('notification', {
        info: notificationInfoStub,
        error: notificationErrorStub
      });

      $provide.value('routing', {
        goToSpace: goToSpaceStub,
        getSpaceId: routingSpaceIdStub,
        getRoute: getRouteStub
      });

      $provide.value('$location', {
        path: pathStub
      });

      $provide.value('client', {
        wrapSpace: wrapSpaceStub
      });

      $provide.value('modalDialog', {
        open: dialogStub
      });

      $provide.value('tutorial', {
        start: tutorialStartStub,
        getSeen: tutorialSeenStub
      });

      $provide.value('presence', {
        isActive: presenceActiveStub
      });

      $provide.value('ReloadNotification', {
        trigger: triggerStub
      });

      $provide.value('revision', {
        hasNewVersion: hasNewVersionStub
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
      expect(auxPanelStub.calledWith(true, {})).toBeTruthy();
    });
  });

  it('space switcher analytics tracking', function () {
    scope.clickedSpaceSwitcher();
    expect(trackStub.called).toBeTruthy();
  });

  describe('on space and token lookup updates', function () {
    beforeEach(inject(function (authentication) {
      spaceIdStub.returns(123);
      hasSpaceStub.withArgs(123).returns(true);
      scope.spaceContext.space = _.extend(scope.spaceContext.space, {cloned: true});
      authentication.tokenLookup = {};
      scope.$digest();
    }));

    it('token lookup is called', function () {
      expect(authorizationTokenLookupStub.called).toBeTruthy();
    });

    it('space id is called', function () {
      expect(spaceIdStub.called).toBeTruthy();
    });

    it('hasSpace is called', function () {
      expect(hasSpaceStub.called).toBeTruthy();
    });

    it('setSpace is called', function () {
      expect(setSpaceStub.calledWith(scope.spaceContext.space)).toBeTruthy();
    });
  });

  it('hideTabBar is true if no tabs are visible', function () {
    numVisibleStub.returns(0);
    expect(scope.hideTabBar()).toBeTruthy();
  });

  it('hideTabBar is false if no tabs are visible', function () {
    numVisibleStub.returns(1);
    expect(scope.hideTabBar()).toBeFalsy();
  });

  it('gets current space id', function () {
    spaceIdStub.returns(123);
    expect(scope.getCurrentSpaceId()).toBe(123);
  });

  describe('select a space', function () {
    var space;
    var idStub;
    beforeEach(function () {
      idStub = sinon.stub();
      spaceIdStub.returns(123);
      space = {
        getId: idStub,
        data: {
          name: 'testspace'
        }
      };
    });

    it('with no space triggers an error notification', function () {
      scope.selectSpace();
      expect(notificationErrorStub.called).toBeTruthy();
    });

    describe('if we are selecting the current space', function () {
      beforeEach(function () {
        idStub.returns(123);
        scope.selectSpace(space);
      });

      it('dont track analytics', function () {
        expect(trackStub.called).toBeFalsy();
      });

      it('dont route to another space', function () {
        expect(goToSpaceStub.called).toBeFalsy();
      });
    });

    describe('if we are selecting a different space', function () {
      beforeEach(function () {
        idStub.returns(456);
        scope.selectSpace(space);
      });

      it('tracks analytics', function () {
        expect(trackStub.called).toBeTruthy();
      });

      it('tracks the space properties', function () {
        expect(trackStub.args[0][1]).toEqual({spaceId: 456, spaceName: 'testspace'});
      });

      it('route to another space', function () {
        expect(goToSpaceStub.calledWith(space)).toBeTruthy();
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
        expect(setSpaceDataStub.called).toBeFalsy();
      });
    });

    describe('changing route but not to the same space', function () {
      beforeEach(function () {
        scope.spaces = [];
        childScope.$emit('$routeChangeSuccess', {params: {spaceId: 123}});
      });

      it('sets no space data on analytics', function () {
        expect(setSpaceDataStub.called).toBeFalsy();
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
        expect(setSpaceDataStub.calledWith(scope.spaces[0])).toBeTruthy();
      });
    });

  });

  describe('watches for spaces array', function () {
    var idStub1, idStub2;
    beforeEach(function () {
      scope.spaces = null;
      scope.$digest();
      spaceIdStub.returns(321);
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
      routingSpaceIdStub.returns(456);
      scope.$digest();
      expect(setSpaceDataStub.calledWith(scope.spaces[1])).toBeTruthy();
    });

    it('redirects to a non existent space and defaults to first space', function () {
      routingSpaceIdStub.returns(789);
      scope.$digest();
      expect(goToSpaceStub.calledWith(scope.spaces[0])).toBeTruthy();
    });

    it('redirects to a space with no routing id and defaults to first space', function () {
      routingSpaceIdStub.returns();
      getRouteStub.returns({
        root: true
      });
      scope.$digest();
      expect(goToSpaceStub.calledWith(scope.spaces[0])).toBeTruthy();
    });

    describe('no space id for redirect provided and not redirecting to root', function () {
      beforeEach(function () {
        getRouteStub.returns({
          root: false
        });
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        expect(goToSpaceStub.called).toBeFalsy();
      });

      it('doesnt set analytics data', function () {
        expect(setSpaceDataStub.called).toBeFalsy();
      });

      it('doesnt set a location path', function () {
        expect(pathStub.called).toBeFalsy();
      });
    });

    describe('redirects to the current space', function () {
      beforeEach(function () {
        scope.spaces = [];
        routingSpaceIdStub.returns(321);
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        expect(goToSpaceStub.called).toBeFalsy();
      });

      it('sets analytics data', function () {
        expect(setSpaceDataStub.called).toBeTruthy();
      });

      it('sets a location path', function () {
        expect(pathStub.called).toBeTruthy();
      });
    });

    describe('redirects to the current space', function () {
      beforeEach(function () {
        routingSpaceIdStub.returns(321);
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        expect(goToSpaceStub.called).toBeFalsy();
      });

      it('doesnt set analytics data', function () {
        expect(setSpaceDataStub.called).toBeFalsy();
      });
    });

    describe('no space can be found', function () {
      beforeEach(function () {
        routingSpaceIdStub.returns(321);
        scope.$digest();
      });

      it('doesnt redirect to another space', function () {
        expect(goToSpaceStub.called).toBeFalsy();
      });

      it('doesnt set analytics data', function () {
        expect(setSpaceDataStub.called).toBeFalsy();
      });
    });
  });

  describe('calls logout', function () {
    beforeEach(function () {
      scope.logout();
    });

    it('tracks analytics event', function () {
      expect(trackStub.called).toBeTruthy();
    });

    it('logs out through authentication', function () {
      expect(logoutStub.called).toBeTruthy();
    });
  });

  describe('open support', function () {
    beforeEach(function () {
      scope.openSupport();
    });

    it('opens new window', function () {
      expect(openStub.called).toBeTruthy();
    });

    it('gets support url', function () {
      expect(supportUrlStub.called).toBeTruthy();
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
        expect(goodbyeStub.called).toBeTruthy();
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
        expect(authenticationTokenLookupStub).toBeTruthy();
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
        expect(notificationErrorStub.calledWith('hai')).toBeTruthy();
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
        expect(notificationInfoStub.calledWith('hai')).toBeTruthy();
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
    expect(trackStub.called).toBeTruthy();
  });

  it('redirects to profile', function () {
    scope.goToProfile();
    expect(pathStub.calledWith('/profile/user')).toBeTruthy();
  });

  it('redirects to profile with a suffix', function () {
    scope.goToProfile('derp');
    expect(pathStub.calledWith('/profile/derp')).toBeTruthy();
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
      getTokenLookupStub.returns({
        then: thenStub
      });
      scope.updateSpaces = sinon.stub();
      scope.performTokenLookup();
    });

    it('expect getTokenLookup to be called', function () {
      expect(getTokenLookupStub.called).toBeTruthy();
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
      wrapSpaceStub.returns(newSpace);

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
      expect(wrapSpaceStub.calledWith(spaces[2])).toBeTruthy();
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
      expect(dialogStub.called).toBeTruthy();
    });

    it('tracks analytics event', function () {
      expect(trackStub.called).toBeTruthy();
    });
  });

  describe('initializes client', function () {
    var thenStub, catchStub, revisionCatchStub;
    beforeEach(function () {
      revisionCatchStub = sinon.stub();
      hasNewVersionStub.returns({catch: revisionCatchStub});
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
        expect(loginTrackStub.called).toBeTruthy();
      });

      it('tutorial seen check is called', function () {
        expect(tutorialSeenStub.called).toBeTruthy();
      });

      it('tutorial start is called', function () {
        expect(tutorialStartStub.called).toBeTruthy();
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
          expect(hasNewVersionStub.called).toBeTruthy();
        });

        it('broadcasts event if new version is available', function () {
          expect(broadcastStub.called).toBeTruthy();
        });
      });


      describe('presence timeout is fired', function () {
        var broadcastStub;
        beforeEach(inject(function ($rootScope) {
          presenceActiveStub.returns(true);
          catchStub.callsArg(0);
          broadcastStub = sinon.stub($rootScope, '$broadcast');
          revisionCatchStub.callsArgWith(0, 'APP_REVISION_CHANGED');
          jasmine.clock().tick(50*60*1000);
        }));

        afterEach(function () {
          broadcastStub.restore();
        });

        it('checks for presence', function () {
          expect(presenceActiveStub.called).toBeTruthy();
        });

        it('checks for new version', function () {
          expect(hasNewVersionStub.called).toBeTruthy();
        });

        it('reload is triggered if lookup fails', function () {
          expect(triggerStub.called).toBeTruthy();
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
        expect(notificationErrorStub.called).toBeTruthy();
      });

      it('user is logged out', function () {
        expect(logoutStub.called).toBeTruthy();
      });
    });

  });

});
