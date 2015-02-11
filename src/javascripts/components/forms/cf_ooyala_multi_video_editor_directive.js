'use strict';

angular.module('contentful').directive('cfOoyalaMultiVideoEditor', [function(){

  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_ooyala_multi_video_editor'](),
    controller : 'cfOoyalaEditorController',
    controllerAs: 'providerVideoEditorController'
  };
}]);
