'use strict';
angular.module('contentful').directive('cfValidationOptions', function ($parse) {

  return {
    restrict: 'C',
    template: JST['cf_validation_options'](),
    require: 'ngModel',
    link: function (scope, elem, attr, ngModel) {
      var ngModelGet = $parse(attr.ngModel),
          ngModelSet = ngModelGet.assign;

      ngModel.$render = function () {
        scope.validationOptions = ngModel.$viewValue;
      };

      ngModel.$parsers.push(function (viewValue) {
        var modelValue = {};
        modelValue[viewValue.type] = viewValue.params;
        return modelValue;
      });

      ngModel.$formatters.push(function (modelValue) {
        var type = scope.validationType(modelValue);
        return {
          type: type,
          params: modelValue[type]
        };
      });

      scope.validationOptionsUpdated = function () {
        ngModel.$setViewValue(scope.validationOptions);
        // setViewValue is not enough, since setting it on the scope will only
        // replace the property in the ng-repeat scope, so we
        // also need to replace it in the parent.
        scope.validationList()[scope.validationIndex] = ngModel.$modelValue;
        scope.updateDoc();
      };
    },
    controller: function CfValidationOptionsCtrl($scope, mimetype) {
      $scope.mimetypeGroups = mimetype.groupDisplayNames;

      $scope.updateDoc = function () {
        if (!angular.isDefined($scope.validationIndex)) return;
        $scope.getValidationDoc($scope.validationIndex).set($scope.validation, function () {
          $scope.$apply($scope.updateValidationsFromDoc);
        });
      };

      $scope.changeType = function (newValidation) {
        var type = $scope.validationType(newValidation);
        $scope.validationOptions.type = type;
        $scope.validationOptions.params = newValidation[type];
        $scope.validationOptionsUpdated();
      };

    }
  };
});
