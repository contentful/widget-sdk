'use strict';

angular.module('contentful/directives').directive('offsetByOne', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elm, attr, ngModelCtrl) {
      ngModelCtrl.$formatters.push(function(value){
        return Number(value)+1;
      });
      ngModelCtrl.$parsers.push(function(value){
        return Number(value)-1;
      });
    }
  };
});
