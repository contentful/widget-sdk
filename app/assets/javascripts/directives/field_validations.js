angular.module('contentful').directive('fieldValidations', function(analytics) {
  'use strict';

  return {
    restrict: 'C',
    template: JST['field_validations'](),
    controller: function($scope) {
      $scope.availableValidations= {
        'size': 'Size',
        'range': 'Numerical Range',
        'regexp': 'Regular Expression',
        'in': 'One of',
        'linkEntryType': 'Content Type'
      };

      function validationListPath () {
        var args = [].splice.call(arguments,0);
        if ($scope.field.type == 'array') {
          return _.flatten(['fields', $scope.index, 'items', 'validations'].concat(args));
        } else {
          return _.flatten(['fields', $scope.index, 'validations'].concat(args));
        }
      };

      $scope.validationList = function () {
        if ($scope.field.type == 'array') {
          return $scope.field.items.validations;
        } else {
          return $scope.field.validations;
        }
      };

      $scope.getValidationDoc = function (validationIndex) {
        if (!angular.isDefined(validationIndex)) throw new Error('No validationIndex');
        return $scope.otDoc.at(validationListPath(validationIndex));
      };

      $scope.getValidationListDoc = function () {
        return $scope.otDoc.at(validationListPath());
      };

      $scope.deleteValidation = function (validationIndex) {
        $scope.getValidationDoc(validationIndex).remove(function(err){
          if (!err) $scope.$apply(function (scope) {
            var validation = $scope.validationList()[validationIndex];
            scope.otUpdateEntity();
            analytics.track('Deleted Validation', {
              fieldId: scope.field.id,
              validationType: $scope.validationType(validation)
            });
          });
        });
      };

      $scope.validationType = function (validation) {
        return _(validation).keys().filter(function(k) { return k !== '$$hashKey'; }).value()[0];
      };

      $scope.updateValidationsFromDoc = function () {
        if ($scope.field.type == 'array') {
          $scope.field.items.validations = $scope.getValidationListDoc().get();
        } else {
          $scope.field.validations = $scope.getValidationListDoc().get();
        }
      };
    }
  };

});
