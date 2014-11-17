'use strict';

angular.module('contentful').directive('cfOoyalaPlayer', ['$injector', function($injector){

  var ooyalaPlayerLoader = $injector.get('ooyalaPlayerLoader');

  var ID_PREFIX = 'ooyala-player-';

  var defaults = {
    showTitle   : true,
    playOnReady : false
  };

  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_ooyala_player'](),
    controller : 'cfOoyalaPlayerController',
    controllerAs: 'ooyalaPlayerController',
    link: function(scope, elem, attrs) {
      var player, ooyala, options, playerId, assetId;

      assetId  = scope.$eval(attrs.assetId);
      playerId = scope.$eval(attrs.playerId);
      options  = _.defaults( {
        showTitle: scope.$eval(attrs.showTitle),
        playOnReady: scope.$eval(attrs.playOnReady)
      }, defaults);

      scope.showTitle     = options.showTitle;
      scope.playerDOMId   = _.uniqueId(ID_PREFIX);
      scope.createPlayer  = createOoyalaPlayer;
      scope.destroyPlayer = destroyOoyalaPlayer;
      scope.pause         = pause;
      scope.play          = play;

      ooyalaPlayerLoader.load(playerId)
        .then(function(_ooyala_){
          ooyala = _ooyala_;

          createOoyalaPlayer();
        })
        .catch(function(){
          scope.destroyPlayer = angular.noop;
          scope.$eval(attrs.onLoadFailure);
        });

       function createOoyalaPlayer() {
        ooyala.Player.create(scope.playerDOMId, assetId,{
          onCreate: handlePlayerCreated
        });
      }

      function destroyOoyalaPlayer() {
        player.mb.unsubscribe(OO.EVENTS.PLAYBACK_READY, 'cfOoyalaPlayer', handlePlaybackReady);
        player.destroy();
        player = undefined;
      }

      function pause() {
        player.pause();
      }

      function play() {
        player.play();
      }

      function handlePlayerCreated(_player_) {
        player = _player_;
        player.mb.subscribe(OO.EVENTS.PLAYBACK_READY, 'cfOoyalaPlayer', handlePlaybackReady);
        player.mb.subscribe(OO.EVENTS.PLAY_FAILED, 'cfOoyalaPlayer', handlePlayFailed);
        player.mb.subscribe(OO.EVENTS.STREAM_PLAY_FAILED, 'cfOoyalaPlayer', handlePlayFailed);
        player.mb.subscribe(OO.EVENTS.ERROR, 'cfOoyalaPlayer', handlePlayFailed);
      }

      function handlePlaybackReady() {
        scope.$apply(function(){
          scope.$emit('player:ready', {title: player.getTitle()});
          scope.$eval(attrs.onReady);

          if (options.playOnReady) player.play();
        });
      }

      function handlePlayFailed() {
        scope.$apply(attrs.onFailedToPlayVideo);
      }
    }
  };
}]);
