'use strict';

angular.module('contentful').directive('cfYoutubeEditor', [function(){

  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_youtube_editor'](),
    controller : 'cfYoutubeEditorController'
  };

}]);
