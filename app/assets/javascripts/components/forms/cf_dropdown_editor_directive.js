'use strict';
angular.module('contentful').directive('cfDropdownEditor', function(){
  return {
    restrict: 'C',
    template: JST['cf_dropdown_editor'](),
    require: 'ngModel',
    controller: 'MultipleValuesController',
    controllerAs: 'valuesController',
    link: function(scope, elem){
      var internalController = elem.find('select').controller('ngModel');
      internalController.$parsers.push(valueParser);
      internalController.$viewChangeListeners.push(scope.otBindInternalChangeHandler);

      function valueParser(value) {
        value = (scope.field.type == 'Integer') ? parseInt(value, 10)   : value;
        value = (scope.field.type == 'Number' ) ? parseFloat(value, 10) : value;
        value = ((scope.field.type == 'Integer' || scope.field.type == 'Number') && isNaN(value)) ? null : value;
        return value;
      }

      scope.dropdownWidthClass = function () {
        var maxValue = _.max(scope.valuesController.valuesList, function (val) {
          return val.label.length;
        });
        var maxLength = _.isObject(maxValue) ? maxValue.label.length : 0;
        if(maxLength <= 19) return 'small-dropdown';
        if(maxLength <= 45) return 'medium-dropdown';
        return 'large-dropdown';
      };
    }
  };
});
