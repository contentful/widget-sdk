'use strict';
angular.module('contentful').directive('cfDropdownEditor', function(){
  return {
    restrict: 'C',
    template: JST['cf_dropdown_editor'](),
    require: 'ngModel',

    link: function(scope, elem, attr, ngModelCtrl){
      scope.valuesList = scope.getFieldValidationsOfType(scope.field, 'in');
      if(!scope.field.required){
        scope.valuesList.unshift('');
      }

      ngModelCtrl.$render = function () {
        scope.selectedValue = ngModelCtrl.$viewValue;
      };

      scope.updateModel = function () {
        ngModelCtrl.$setViewValue(scope.selectedValue);
      };

      scope.dropdownWidthClass = function () {
        var maxLength = _.max(scope.valuesList, 'length').length;
        if(maxLength <= 19) return 'small-dropdown';
        if(maxLength <= 45) return 'medium-dropdown';
        return 'large-dropdown';
      };
    },

    controller: function cfDropdownEditorController ($scope, $parse, $attrs) {
      var ngModelGet = $parse($attrs.ngModel),
          ngModelSet = ngModelGet.assign;

      $scope.selectDropdownValue = function (value) {
        function handler(err) {
          if(!err){
            $scope.selectedValue = value;
            $scope.updateModel();
          }
        }

        value = ($scope.field.type == 'Integer') ? parseInt(value, 10) : value;
        value = ($scope.field.type == 'Number') ? parseFloat(value, 10) : value;
        value = (($scope.field.type == 'Integer' || $scope.field.type == 'Number') && isNaN(value)) ? null : value;

        $scope.otChangeValue(value, handler);
      };

      $scope.$on('otValueChanged', function(event, path, value) {
        if (path === event.currentScope.otPath) ngModelSet(event.currentScope, value);
      });
    }
  };
});
