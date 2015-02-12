'use strict';

describe('cfOoyalaPlayer Directive', function() {
  var directive, ooyalaPlayerLoaderDeferred, scope, $compile, $window;

  function compileDirective(scope) {
    return  $compile('<cf-ooyala-player/>')(scope);
  }

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      $provide.value('ooyalaPlayerLoader', jasmine.createSpyObj('ooyalaPlayerLoaderStub', ['load']));
    });

    inject(function($injector, $q, $rootScope, ooyalaPlayerLoader){
      $compile   = $injector.get('$compile');
      $window    = $injector.get('$window');

      $window.OO = { EVENTS: { PLAYBACK_READY: 0, PLAY_FAILED: 1, STREAM_PLAY_FAILED: 2, ERROR: 3 }};

      ooyalaPlayerLoaderDeferred = $q.defer();
      ooyalaPlayerLoader.load.and.returnValue(ooyalaPlayerLoaderDeferred.promise);

      scope                         = $rootScope.$new();
      scope.videoWidgetPlayer = {
        callbacks: {
          onInit              : jasmine.createSpy(),
          onFailedToPlayVideo : jasmine.createSpy(),
          onReady             : jasmine.createSpy()
        },
        attrs : {
          assetId  : 2,
          playerId : 1
        }
      };

      directive = compileDirective(scope);
      scope.$apply();
    });
  });

  it('calls the "onInit" callback', function() {
    expect(scope.videoWidgetPlayer.callbacks.onInit).toHaveBeenCalled();
  });

  it('generates different DOM ids for each new player', function() {
    var otherDirective = compileDirective(scope);
    scope.$apply();

    expect(directive.scope().playerDOMId).not.toEqual(otherDirective.scope().playerDOMId);
  });

  describe('Ooyala player loads successfully', function() {
    var ooyalaStub;

    beforeEach(function() {
      ooyalaStub = {Player: {create: jasmine.createSpy()}};
      ooyalaPlayerLoaderDeferred.resolve(ooyalaStub);
      scope.$apply();
    });

    describe('creates the player', function() {
      var args;

      beforeEach(function() { args = ooyalaStub.Player.create.calls.mostRecent().args; });

      it('calls the #create method on the oolaya object', function() {
        expect(ooyalaStub.Player.create).toHaveBeenCalled();
      });

      it('passes the DOM id as the first argument', function(){
        expect(args[0]).toMatch(/ooyala-player/);
      });

      it('passes the asset id as the second argument', function(){
        expect(args[1]).toEqual(scope.videoWidgetPlayer.attrs.assetId);
      });

      it('passes an options object as the third argument', function() {
        expect(args[2].onCreate).toEqual(jasmine.any(Function));
      });
    });

    describe('on player creation', function() {
      var playerStub;

      beforeEach(function() {
        playerStub = {mb: {subscribe: jasmine.createSpy()}, getTitle: sinon.stub().returns('title-1')};
        ooyalaStub.Player.create.calls.argsFor(0)[2].onCreate(playerStub);
      });

      function executeCallbackForEvent(event) {
        _.find(playerStub.mb.subscribe.calls.all(), function(call){
          return call.args[0] == event;
        }).args[2]();
      }

      function itSubscribesTo(event) {
        expect(playerStub.mb.subscribe).toHaveBeenCalledWith(event, 'cfOoyalaPlayer', jasmine.any(Function));
      }

      it('subscribes to events', function() {
        itSubscribesTo($window.OO.EVENTS.PLAYBACK_READY);
        itSubscribesTo($window.OO.EVENTS.PLAY_FAILED);
        itSubscribesTo($window.OO.EVENTS.STREAM_PLAY_FAILED);
        itSubscribesTo($window.OO.EVENTS.ERROR);
      });

      describe('on playback ready', function() {
        var eventHandlerSpy;
        beforeEach(function() {
          eventHandlerSpy = jasmine.createSpy();
          scope.$on('player:ready', eventHandlerSpy);

          executeCallbackForEvent($window.OO.EVENTS.PLAYBACK_READY);
        });

        it('emits the player:ready event', function(){
          expect(eventHandlerSpy).toHaveBeenCalledWith(jasmine.any(Object), {title: 'title-1'});
        });

        it('executes the onReady callback', function() {
          expect(scope.videoWidgetPlayer.callbacks.onReady).toHaveBeenCalled();
        });
      });

      it('executes the onPlayFailedToPlayVideo callback on playback error', function() {
        executeCallbackForEvent($window.OO.EVENTS.ERROR);
        expect(scope.videoWidgetPlayer.callbacks.onFailedToPlayVideo).toHaveBeenCalled();
      });

      it('executes the onPlayFailedToPlayVideo callback on stream play error', function() {
        executeCallbackForEvent($window.OO.EVENTS.STREAM_PLAY_FAILED);
        expect(scope.videoWidgetPlayer.callbacks.onFailedToPlayVideo).toHaveBeenCalled();
      });

      it('executes the onPlayFailedToPlayVideo callback on general error', function() {
        executeCallbackForEvent($window.OO.EVENTS.ERROR);
        expect(scope.videoWidgetPlayer.callbacks.onFailedToPlayVideo).toHaveBeenCalled();
      });
    });
  });
});
