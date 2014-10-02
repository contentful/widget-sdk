'use strict';

angular.module('contentful').directive('cfYoutubePlayer', ['$injector', function($injector){

  var youtubePlayerLoader = $injector.get('youtubePlayerLoader');

  var YOUTUBE_DOM_ELEMENT_CLASS = '.youtube-player';

  function installPlayerInDOM(element, YoutubePlayer) {
    return new YoutubePlayer(element, { width: '100%' });
  }

  function handlePlayerReady(scope, attrs, event) {
    scope.player = event.target;
    scope.$apply(function(){
      scope.handlePlayerInstalled();
      _.result(scope, attrs.onReady);
    });
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

  function handlePlayerLoaded(scope, attrs, elem, YoutubePlayer) {
      var player = installPlayerInDOM(elem.find(YOUTUBE_DOM_ELEMENT_CLASS)[0], YoutubePlayer);

      player.addEventListener('onReady', _.curry(handlePlayerReady)(scope, attrs));
      player.addEventListener('onStateChange', _.curry(handlePlayerStateChange)(scope, attrs));
      player.addEventListener('onError', _.curry(handlePlayerError)(scope, attrs));
  }

  function handlePlayerLoadError(scope, attrs) {
    return function(){
      _.result(scope, attrs.onFailure);
    };
  }

  function link(scope, elem, attrs) {
    youtubePlayerLoader.load().then( _.curry(handlePlayerLoaded)(scope, attrs, elem), handlePlayerLoadError(scope, attrs));
  }

  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_youtube_player'](),
    controller : 'cfYoutubePlayerController',
    link       : link
  };

}]);
