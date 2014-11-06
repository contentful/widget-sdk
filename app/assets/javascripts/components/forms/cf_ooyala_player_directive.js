'use strict';

angular.module('contentful').directive('cfOoyalaPlayer', ['$injector', function($injector){

  var ooyalaPlayerLoader = $injector.get('ooyalaPlayerLoader');

  var ID_PREFIX = 'ooyala-player-';

  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_ooyala_player'](),
    controller : 'cfOoyalaPlayerController',
    link: function(scope, elem, attrs) {
      var player, ooyala;

      scope.playerDOMId = _.uniqueId(ID_PREFIX);

      ooyalaPlayerLoader.load(scope.playerId)
        .then(function(_ooyala_){
          ooyala = _ooyala_;

          scope.createPlayer  = createOoyalaPlayer;
          scope.destroyPlayer = destroyOoyalaPlayer;

          scope.$emit('player:loaded'); //no need to call $apply. Already in angular land
        })
        .catch(function(){
          scope.destroyPlayer = angular.noop;
          scope.$eval(attrs.onLoadFailure);
        });

      function createOoyalaPlayer(assetId) {
        ooyala.Player.create(scope.playerDOMId, assetId,{
          onCreate: handlePlayerCreated
        });
      }

      function destroyOoyalaPlayer() {
        player.mb.unsubscribe(OO.EVENTS.PLAYBACK_READY, 'cfOoyalaPlayer', handlePlaybackReady);
        player.destroy();
        player = undefined;
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
        });
      }

      function handlePlayFailed() {
        scope.$apply(attrs.onFailedToPlayVideo);
      }
    }
  };


}]);

