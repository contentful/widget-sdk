'use strict';

angular.module('contentful').directive('cfYoutubePlayer', ['$injector', function($injector){

  var $q                  = $injector.get('$q');
  var youtubePlayerLoader = $injector.get('youtubePlayerLoader');

  var YOUTUBE_DOM_ELEMENT_CLASS = '.youtube-player';

  function installPlayerInDOM(element, YoutubePlayer) {
    return new YoutubePlayer(element, { width: '100%' });
  }

  function handlePlayerReady(scope, attrs, event) {
    scope.player = event.target;
    scope.handlePlayerInstalled();
  }

  function handlePlayerStateChange(scope, attrs, event) {
    if (event.data == YT.PlayerState.CUED){
      scope.$apply(function(){
        _.result(scope, attrs.onReadyToPlayVideo);
      });
    }
  }

  function handlePlayerError(scope, attrs, event) {
    scope.$apply(function(){
      _.result(scope, attrs.onFailedToPlayVideo);
    });
  }

  function link(scope, elem, attrs) {

    youtubePlayerLoader.load().then(function(YoutubePlayer){
      var player = installPlayerInDOM(elem.find(YOUTUBE_DOM_ELEMENT_CLASS)[0], YoutubePlayer);

      player.addEventListener('onReady', _.curry(handlePlayerReady)(scope, attrs));
      player.addEventListener('onStateChange', _.curry(handlePlayerStateChange)(scope, attrs));
      player.addEventListener('onError', _.curry(handlePlayerError)(scope, attrs));
    });
  }

  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_youtube_player'](),
    controller : 'cfYoutubePlayerController',
    link       : link
  };

}]);
