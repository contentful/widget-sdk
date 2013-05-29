'use strict';

angular.module('contentful').controller('NewValidationCtrl', function ($scope, analytics) {
  $scope.validation = null;

  $scope.prepareNewValidation = function () {
    $scope.validation = {};
    $scope.validation[$scope.newValidationType] = {};
  };

  $scope.createValidation = function () {
    var validationListOwnerDoc = getValidationListOwnerDoc();
    if (!validationListOwnerDoc.get().validations) {
      validationListOwnerDoc.at(['validations']).set([$scope.validation], callback);
    } else {
      var validationsDoc = $scope.otDoc.at($scope.validationListPath());
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

    function getValidationListOwnerDoc() {
      if ($scope.field.type == 'array') {
        return $scope.otDoc.at(['fields', $scope.index, 'items']);
      } else {
        return $scope.otDoc.at(['fields', $scope.index]);
      }
    }
  };

});
