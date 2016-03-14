'use strict';

angular.module('contentful').directive('cfKalturaEditor', [function(){
  return {
    restrict: 'E',
    template: '<cf-video-editor></cf-video-editor>',
    controller: 'cfKalturaEditorController',
    controllerAs: 'providerVideoEditorController'
  };
}]);

