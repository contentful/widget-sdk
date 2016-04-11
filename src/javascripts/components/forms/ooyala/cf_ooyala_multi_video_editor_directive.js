'use strict';

angular.module('contentful').directive('cfOoyalaMultiVideoEditor', [function(){

  return {
    restrict: 'E',
    scope: true,
    template: '<cf-multi-video-editor />',
    controller: 'cfOoyalaEditorController',
    controllerAs: 'providerVideoEditorController'
  };
}]);
