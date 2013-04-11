angular.module('contentful/directives').
directive('validationOptions', function () {
  'use strict';

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
          var validationDoc = $scope.doc.at($scope.validationPath);
          validationDoc.set($scope.validation, function () {
            $scope.$apply(function () {
              $scope.updateValidationsFromDoc();
            });
          });
        }
      };

    }
  };

}).
controller('NewValidationCtrl', function ($scope) {
  'use strict';

  $scope.validation = null;

  $scope.prepareNewValidation = function () {
    $scope.validation = {};
    $scope.validation[$scope.newValidationType] = {};
  };

  $scope.createValidation = function () {
    var fieldDoc = $scope.doc.at(['fields', $scope.index]);
    if (!fieldDoc.get().validations) {
      fieldDoc.at(['validations']).set([$scope.validation], callback);
    } else {
      var validationsDoc = $scope.doc.at(['fields', $scope.index, 'validations']);
      validationsDoc.push($scope.validation, callback);
    }

    function callback(err) {
      if (!err) $scope.$apply(function (scope) {
        scope.prepareNewValidation();
        scope.updateValidationsFromDoc();
      });
    }
  };

});
