'use strict';
angular.module('contentful').directive('cfDropdownEditor', function(){
  return {
    restrict: 'C',
    template: JST['cf_dropdown_editor'](),
    require: 'ngModel',

    link: function(scope, elem){
      scope.valuesList = scope.getFieldValidationsOfType(scope.field, 'in');
      scope.selected = {value: null};

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
        var maxLength = (_.max(scope.valuesList, function (val) {
          if(typeof val == 'string') return val.length;
          if(typeof val == 'number') return (val+'').length;
        })+'').length;
        if(maxLength <= 19) return 'small-dropdown';
        if(maxLength <= 45) return 'medium-dropdown';
        return 'large-dropdown';
      };
    }
  };
});
