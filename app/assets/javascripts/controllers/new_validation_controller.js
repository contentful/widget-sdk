'use strict';

angular.module('contentful').controller('NewValidationCtrl', function ($scope, analytics) {
  $scope.validation = null;

  $scope.prepareNewValidation = function () {
    $scope.validation = {};
    $scope.validation[$scope.newValidationType] = {};
  };

  $scope.createValidation = function () {
    var listDoc = $scope.getValidationListDoc();
    if (listDoc.get()) {
      listDoc.push($scope.validation, callback);
    } else {
      listDoc.set([$scope.validation], callback);
    }

    function callback(err) {
      if (!err) $scope.$apply(function (scope) {
        scope.prepareNewValidation();
        scope.updateValidationsFromDoc();
        analytics.track('Added Validation', {
          fieldId: scope.field.id,
          validationType: scope.validationType(scope.validation)
        });
      });
    }
  };

});
