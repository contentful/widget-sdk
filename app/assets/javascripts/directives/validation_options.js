'use strict';
angular.module('contentful').directive('validationOptions', function () {
  return {
    restrict: 'C',
    template: JST['validation_options'](),
    replace: true,
    controller: function ValidationOptionsCtrl($scope) {
      $scope.validationType = function (validation) {
        return _(validation).keys().filter(function(k) { return k !== '$$hashKey'; }).value()[0];
      };

      $scope.$watch('[index, validationIndex]', function (value, old, scope) {
        scope.validationPath = ['fields', scope.index, 'validations', scope.validationIndex];
      }, true);

      $scope.updateDoc = function () {
        if (angular.isDefined($scope.validationIndex)) {
          var validationDoc = $scope.otDoc.at($scope.validationPath);
          validationDoc.set($scope.validation, function () {
            $scope.$apply(function () {
              $scope.updateValidationsFromDoc();
            });
          });
        }
      };

    }
  };
});
