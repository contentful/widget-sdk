'use strict';

angular.module('contentful').directive('cfOoyalaEditor', [function(){

  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_ooyala_editor'](),
    controller : 'cfOoyalaEditorController'
  };

}]);
