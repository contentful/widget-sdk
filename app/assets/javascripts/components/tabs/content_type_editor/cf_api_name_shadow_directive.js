'use strict';
angular.module('contentful').directive('cfApiNameShadow', ['$injector', function($injector){
  var $parse = $injector.get('$parse');

  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attr, ngModelController){
      var getField = $parse(attr.cfApiNameShadow);
      ngModelController.$formatters.push(function(modelValue){
        modelValue = ngModelController.$modelValue;
        return (modelValue === undefined || modelValue === null) ? getField(scope).id : modelValue;
      });
    }
  };
}]);
