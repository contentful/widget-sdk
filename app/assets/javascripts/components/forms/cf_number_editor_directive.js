'use strict';
angular.module('contentful').directive('cfNumberEditor', function(){
  return {
    restrict: 'C',
    template: '<input type="text" ng-model="fieldData.value" ot-bind-model ng-disabled="!otEditable">',
    replace: true,
    require: 'ngModel',
    link: function(scope, elem, attr, ngModel){
      ngModel.$parsers.push(function (viewValue) {
        var floatVal = parseFloat(viewValue, 10);
        var intVal   = parseInt(viewValue, 10);
        if (scope.field.type === 'Integer' && floatVal !== intVal) {
          ngModel.$setValidity('integer', false);
        } else {
          ngModel.$setValidity('integer', true);
        }
        return scope.field.type === 'Integer' ? intVal : floatVal;
      });
    }
  };
});

