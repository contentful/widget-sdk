'use strict';

angular.module('contentful').directive('cfOoyalaPlayer', ['require', function (require){

  var ooyalaPlayerLoader = require('ooyalaPlayerLoader');

  var ID_PREFIX = 'ooyala-player-';

  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_ooyala_player'](),
    link: function(scope) {
      var player, ooyala, playOnReady, playerId, assetId;

      scope.$eval(scope.videoWidgetPlayer.callbacks.onInit);

      assetId     = scope.videoWidgetPlayer.attrs.assetId;
      playerId    = scope.videoWidgetPlayer.attrs.playerId;
      playOnReady = scope.videoWidgetPlayer.attrs.embedded;

      scope.playerDOMId   = _.uniqueId(ID_PREFIX);
      scope.pause         = pause;
      scope.play          = play;

      ooyalaPlayerLoader.load(playerId)
        .then(function(_ooyala_){
          ooyala = _ooyala_;

          createOoyalaPlayer();
        });

       function createOoyalaPlayer() {
        ooyala.Player.create(scope.playerDOMId, assetId,{
          onCreate: handlePlayerCreated
        });
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
          scope.$eval(scope.videoWidgetPlayer.callbacks.onReady);

          if (playOnReady) player.play();
        });
      }

      function handlePlayFailed() {
        scope.$apply(scope.videoWidgetPlayer.callbacks.onFailedToPlayVideo);
      }
    }
  };
}]);
