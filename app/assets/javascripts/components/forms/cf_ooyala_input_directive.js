'use strict';

angular.module('contentful').directive('cfOoyalaInput', function(){
  return {
    restrict: 'E',
    template: JST['cf_ooyala_input'](),
    controller: 'cfOoyalaInputController',
    controllerAs: 'inputController'
  };
});
