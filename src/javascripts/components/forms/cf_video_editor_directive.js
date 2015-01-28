'use strict';

angular.module('contentful').directive('cfVideoEditor', [function(){
  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_video_editor'](),
    controller : 'cfVideoEditorController',
    controllerAs : 'videoEditorController'
  };
}]);
