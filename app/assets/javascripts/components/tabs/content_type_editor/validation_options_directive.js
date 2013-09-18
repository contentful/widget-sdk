'use strict';
angular.module('contentful').directive('validationOptions', function () {
  return {
    restrict: 'C',
    template: JST['validation_options'](),
    replace: true,
    controller: function ValidationOptionsCtrl($scope, mimetype) {
      $scope.mimetypeGroups = mimetype.groupDisplayNames;

      $scope.updateDoc = function () {
        if (!angular.isDefined($scope.validationIndex)) return;
        $scope.getValidationDoc($scope.validationIndex).set($scope.validation, function () {
          $scope.$apply($scope.updateValidationsFromDoc);
        });
      };

    }
  };
});
