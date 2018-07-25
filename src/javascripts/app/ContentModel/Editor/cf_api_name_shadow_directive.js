'use strict';
angular.module('contentful').directive('cfApiNameShadow', ['require', require => {
  const $parse = require('$parse');

  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elem, attr, ngModelController) {
      const getField = $parse(attr.cfApiNameShadow);
      ngModelController.$formatters.push(modelValue => {
        modelValue = ngModelController.$modelValue;
        return (modelValue === undefined || modelValue === null) ? getField(scope).id : modelValue;
      });

      ngModelController.$render = () => {
        // Fix for https://github.com/angular/angular.js/commit/3e51b84bc19f7e6acc61cb536ddcdbfed307c831#diff-c244afd8def7f268b16ee91a0341c4b2L1003
        elem.val(ngModelController.$isEmpty(ngModelController.$viewValue) ? '' : ngModelController.$viewValue);
      };
    }
  };
}]);
