'use strict';

angular.module('contentful').directive('cfYoutubePlayer', ['$injector', function($injector){


  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_youtube_player'](),
    controller : 'cfYoutubePlayerController'
  };

}]);
