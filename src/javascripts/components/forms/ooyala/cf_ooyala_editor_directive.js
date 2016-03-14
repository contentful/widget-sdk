'use strict';

angular.module('contentful').directive('cfOoyalaEditor', [function(){
  return {
    restrict: 'E',
    scope: true,
    template: '<cf-video-editor></cf-video-editor>',
    controller: 'cfOoyalaEditorController',
    controllerAs: 'providerVideoEditorController'
  };
}]);
