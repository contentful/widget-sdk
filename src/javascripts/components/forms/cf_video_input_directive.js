'use strict';

angular.module('contentful').directive('cfVideoInput', function(){
  return {
    restrict: 'E',
    template: JST['cf_video_input'](),
    controller: 'cfVideoInputController',
    controllerAs: 'videoInputController'
  };
});
