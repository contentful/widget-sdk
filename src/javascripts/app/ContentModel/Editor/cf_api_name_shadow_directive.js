'use strict';
angular.module('contentful').directive('cfApiNameShadow', ['$injector', function ($injector) {
  var $parse = $injector.get('$parse');

  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elem, attr, ngModelController) {
      var getField = $parse(attr.cfApiNameShadow);
      ngModelController.$formatters.push(function (modelValue) {
        modelValue = ngModelController.$modelValue;
        return (modelValue === undefined || modelValue === null) ? getField(scope).id : modelValue;
      });

      ngModelController.$render = function () {
        // Fix for https://github.com/angular/angular.js/commit/3e51b84bc19f7e6acc61cb536ddcdbfed307c831#diff-c244afd8def7f268b16ee91a0341c4b2L1003
        elem.val(ngModelController.$isEmpty(ngModelController.$viewValue) ? '' : ngModelController.$viewValue);
      };
    }
  };
}]);
