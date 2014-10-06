'use strict';

angular.module('contentful').directive('cfYoutubePlayer', ['$injector', function($injector){
  var $window = $injector.get('$window');
  var youtubePlayerLoader = $injector.get('youtubePlayerLoader');

  var YOUTUBE_DOM_ELEMENT_CLASS = '.youtube-player';

  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_youtube_player'](),
    controller : 'cfYoutubePlayerController',
    link       : function link(scope, elem, attrs){
      youtubePlayerLoader.load()
      .then(function(YoutubePlayer){
        var player = installPlayerInDOM(elem.find(YOUTUBE_DOM_ELEMENT_CLASS)[0], YoutubePlayer);
        player.addEventListener('onReady',       handlePlayerReady);
        player.addEventListener('onStateChange', handlePlayerStateChange);
        player.addEventListener('onError',       handlePlayerError);
      })
      .catch(function(){
        scope.$apply(attrs.onFailure);
      });

      function installPlayerInDOM(element, YoutubePlayer) {
        return new YoutubePlayer(element, { width: '100%' });
      }

      function handlePlayerReady(event) {
        scope.player = event.target;
        scope.$apply(function(){
          scope.handlePlayerInstalled();
          scope.$eval(attrs.onReady);
        });
      }

      function handlePlayerStateChange(event) {
        if (event.data == $window.YT.PlayerState.CUED){
          scope.$apply(attrs.onReadyToPlayVideo);
        }
      }

      function handlePlayerError() {
        scope.$apply(attrs.onFailedToPlayVideo);
      }

    }
  };

}]);
