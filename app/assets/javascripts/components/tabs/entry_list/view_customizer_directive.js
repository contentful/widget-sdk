'use strict';

angular.module('contentful').directive('viewCustomizer', function(){
  return {
    template: JST.view_customizer(),
    restrict: 'C',
    controller: 'ViewCustomizerCtrl',
    link: function (scope, elem) {
    }
  };
});
