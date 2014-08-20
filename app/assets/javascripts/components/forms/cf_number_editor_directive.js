'use strict';
angular.module('contentful').directive('cfNumberEditor', function(){
  return {
    restrict: 'C',
    template: '<input type="text" class="form-control" ng-model="fieldData.value" ot-bind-model ng-disabled="!otEditable"><i cf-field-alert="{{parseWarning}}" tooltip-placement="left"></i>',
    link: function(scope, elem){
      var ngModel = elem.find('input').controller('ngModel');
      ngModel.$parsers.push(function (viewValue) {
        var floatVal = parseFloat(viewValue, 10);
        var intVal   = parseInt(viewValue, 10);
        var modelVal;
        if (scope.field.type === 'Integer' && floatVal !== intVal) {
          ngModel.$setValidity('integer', false);
        } else {
          ngModel.$setValidity('integer', true);
        }
        modelVal = scope.field.type === 'Integer' ? intVal : floatVal;
        if (_.isEmpty(viewValue)) {
          scope.parseWarning = '';
        } else if (isNaN(modelVal)) {
          scope.parseWarning = 'Unrecognized Number';
        } else if (modelVal.toString() !== viewValue) {
          scope.parseWarning = 'Recognized value: ' + modelVal;
        } else {
          scope.parseWarning = '';
        }
        modelVal = isNaN(modelVal) ? null : modelVal;
        return modelVal;
      });

    }
  };
});

