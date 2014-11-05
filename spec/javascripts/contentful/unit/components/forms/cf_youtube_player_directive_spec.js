'use strict';

describe('cfYoutubePlayer Directive', function() {
  var directive, scope, defer, $rootScope, $window;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      var youtubePlayerLoaderMock = jasmine.createSpyObj('youtubePlayerLoaderMock', ['load']);
      $provide.value('youtubePlayerLoader', youtubePlayerLoaderMock);
    });

    inject(function($injector, $compile, $q, youtubePlayerLoader){
      $rootScope = $injector.get('$rootScope');
      $window    = $injector.get('$window');
      scope      = $rootScope.$new();

      scope.handlePlayerFailure = jasmine.createSpy('handlePlayerFailure');
      scope.handlePlayerReady   = jasmine.createSpy('handlePlayerReady');
      scope.handlePlayerFailedToPlayVideo = jasmine.createSpy('handlePlayerFailedToPlayVideo');
      scope.handlePlayerReadyToPlayVideo  = jasmine.createSpy('handlePlayerReadyToPlayVideo');

      defer                     = $q.defer();
      youtubePlayerLoader.load.and.returnValue(defer.promise);

      directive = $compile('<cf-youtube-player on-ready-to-play-video="handlePlayerReadyToPlayVideo()" on-failed-to-play-video="handlePlayerFailedToPlayVideo()" on-ready="handlePlayerReady()" on-failure="handlePlayerFailure()"><cf-youtube-player>')(scope);
      scope.$apply();
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  describe('Youtube Player load fails', function() {
    beforeEach(function() {
      defer.reject();
      $rootScope.$apply();
    });

    it('executes the callback on the onFailure attribute', function() {
      expect(scope.handlePlayerFailure).toHaveBeenCalled();
    });
  });

  describe('Youtube Player load succeeds', function() {
    var YoutubePlayerStub, player;
    beforeEach(function() {
      player            = jasmine.createSpyObj('player', ['cueVideoById', 'addEventListener']);
      YoutubePlayerStub = jasmine.createSpy().and.returnValue(player);

      defer.resolve(YoutubePlayerStub);
      $rootScope.$apply();
    });

    it('install the player in the DOM', function() {
      expect(YoutubePlayerStub).toHaveBeenCalled();
    });

    it('exposes on the scope a function to cue a video on the player', function() {
      directive.scope().cueVideoById(1);

      expect(player.cueVideoById).toHaveBeenCalledWith(1);
    });

    describe('reacts to player events', function() {
      var cbs;
      beforeEach(function() {
        cbs = {};
        player.addEventListener.calls.all().forEach(function(call){
          cbs[call.args[0]] = call.args[1];
        });
      });

      describe('onReady', function() {
        it('executes the callback on the onReady attribute ', function() {
          cbs.onReady();

          expect(scope.handlePlayerReady).toHaveBeenCalled();
        });
      });

      describe('onError', function() {
        it('executes the callback on the onFailedToPlayVideo attribute', function() {
          cbs.onError();

          expect(scope.handlePlayerFailedToPlayVideo).toHaveBeenCalled();
        });
      });

      describe('onStateChange', function() {
        beforeEach(function() {
          $window.YT = {PlayerState : {CUED: 'cued'}};
        });

        describe('when the state is CUED', function() {
          it('executes the callback on the onReadyToPlayVideo attribute', function() {
            cbs.onStateChange({data: 'cued'});

            expect(scope.handlePlayerReadyToPlayVideo).toHaveBeenCalled();
          });
        });

        describe('when the state is not CUED', function() {
          it('does not execute the callback on the onReadyToPlayVideo attribute', function() {
            cbs.onStateChange({data: 'not_cued_state'});

            expect(scope.handlePlayerReadyToPlayVideo).not.toHaveBeenCalled();
          });
        });
      });
    });

  });
});
