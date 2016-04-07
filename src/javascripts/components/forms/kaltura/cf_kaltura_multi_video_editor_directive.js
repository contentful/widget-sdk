'use strict';

angular.module('contentful').directive('cfKalturaMultiVideoEditor', [function(){

  return {
    restrict: 'E',
    scope: true,
    template: '<cf-multi-video-editor />',
    controller: 'cfKalturaMultiVideoEditorController',
    controllerAs: 'providerVideoEditorController'
  };

}]);
