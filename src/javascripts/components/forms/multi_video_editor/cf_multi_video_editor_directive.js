'use strict';

angular.module('contentful').directive('cfMultiVideoEditor', [function(){
  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_multi_video_editor'](),
    controller : 'cfMultiVideoEditorController',
    controllerAs: 'multiVideoEditorController',
    link: function(scope, elem) {
      scope.videoInputController = videoInputController;

      function videoInputController() {
        return elem.find('cf-video-input').controller('cfVideoInput');
      }
    }
  };
}]);
