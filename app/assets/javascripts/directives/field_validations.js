angular.module('contentful').directive('fieldValidations', function(analytics) {
  'use strict';

  return {
    restrict: 'C',
    template: JST['field_validations'](),
    controller: function($scope) {
      $scope.availableValidations= {
        size: 'Size',
        range: 'Numerical Range',
        regexp: 'Regular Expression',
        in: 'One of',
        linkEntryType: 'Content Type'
      };

      $scope.deleteValidation = function (validationIndex) {
        var validation = $scope.field.validations[validationIndex];
        $scope.otDoc.at(['fields', $scope.index, 'validations', validationIndex]).remove(function(err){
          if (!err) $scope.$apply(function (scope) {
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
        $scope.field.validations = $scope.otDoc.at(['fields', $scope.index, 'validations']).get();
      };
    }
  };

});
