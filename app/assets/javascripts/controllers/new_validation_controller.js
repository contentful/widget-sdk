'use strict';

angular.module('contentful').controller('NewValidationCtrl', function ($scope, analytics) {
  $scope.validation = null;

  $scope.prepareNewValidation = function () {
    $scope.validation = {};
    $scope.validation[$scope.newValidationType] = {};
  };

  $scope.createValidation = function () {
    var fieldDoc = $scope.otDoc.at(['fields', $scope.index]);
    if (!fieldDoc.get().validations) {
      fieldDoc.at(['validations']).set([$scope.validation], callback);
    } else {
      var validationsDoc = $scope.otDoc.at(['fields', $scope.index, 'validations']);
      validationsDoc.push($scope.validation, callback);
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
