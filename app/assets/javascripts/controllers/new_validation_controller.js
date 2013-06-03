'use strict';

angular.module('contentful').controller('NewValidationCtrl', function ($scope, analytics) {
  var _validationListPath;
  $scope.validation = null;

  $scope.prepareNewValidation = function () {
    $scope.validation = {};
    $scope.validation[$scope.newValidationType] = {};
  };

  $scope.$watch('field', function (field, old, scope) {
    scope.fieldWithNewValidation = angular.copy(field);
    if (field.type == 'array') {
      scope.fieldWithNewValidation.items.validations = [];
      _validationListPath = ['items', 'validations', 0];
    } else {
      scope.fieldWithNewValidation.validations = [];
      _validationListPath = ['validations', 0];
    }
  });

  $scope.$watch('validation', function (validation, old, scope) {
    var validations;
    if (scope.field.type == 'array') {
      validations = scope.fieldWithNewValidation.items.validations;
    } else {
      validations = scope.fieldWithNewValidation.validations;
    }
    validations.length = 0;
    validations.push(validation);
  });

  $scope.validationListPath = function () {
    return _validationListPath;
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
