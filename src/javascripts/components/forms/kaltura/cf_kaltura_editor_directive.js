'use strict';

angular.module('contentful').directive('cfKalturaEditor', [function(){
  return {
    restrict   : 'E',
    template   : JST['cf_kaltura_editor'](),
    controller : 'cfKalturaEditorController',
    controllerAs: 'providerVideoEditorController'
  };
}]);

