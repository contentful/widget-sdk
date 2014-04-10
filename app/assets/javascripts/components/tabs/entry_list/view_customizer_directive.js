'use strict';

angular.module('contentful').directive('viewCustomizer', function(){
  return {
    template: JST.view_customizer(),
    restrict: 'C',
    link: function (scope, elem) {
    }
  };
});
