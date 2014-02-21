'use strict';
angular.module('contentful').directive('cfDropdownEditor', function(){
  return {
    restrict: 'C',
    replace: true,
    template: JST['cf_dropdown_editor'](),
    require: 'ngModel',

    link: function(scope, elem, attr, ngModelCtrl){
      scope.valuesList = scope.getFieldValidationsOfType(scope.field, 'in');

      scope.selected = {value: null};

      scope.$watch('selected.value', function (val) {
        scope.selectDropdownValue(val);
      });

      ngModelCtrl.$render = function () {
        scope.selected.value = ngModelCtrl.$viewValue;
      };

      scope.updateModel = function () {
        ngModelCtrl.$setViewValue(scope.selected.value);
      };

      scope.dropdownWidthClass = function () {
        var maxLength = (_.max(scope.valuesList, function (val) {
          if(typeof val == 'string') return val.length;
          if(typeof val == 'number') return (val+'').length;
        })+'').length;
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
            $scope.selected.value = value;
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
