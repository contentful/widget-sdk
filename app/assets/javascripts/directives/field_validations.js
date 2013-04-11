angular.module('contentful/directives').directive('fieldValidations', function() {
  'use strict';

  return {
    restrict: 'C',
    template: JST['field_validations'](),
    controller: function($scope) {
      $scope.availableValidations= {
        size: 'Size',
        range: 'Range',
        regexp: 'Regular Expression',
        in: 'One of'
      };

      $scope.deleteValidation = function (validationIndex) {
        $scope.doc.at(['fields', $scope.index, 'validations', validationIndex]).remove(function(err){
          if (!err) $scope.$apply(function (scope) {
            scope.otUpdateEntity();
          });
        });

      };

      $scope.validationType = function (validation) {
        return _(validation).keys().filter(function(k) { return k !== '$$hashKey'; }).value()[0];
      };

      $scope.updateValidationsFromDoc = function () {
        $scope.field.validations = $scope.doc.at(['fields', $scope.index, 'validations']).get();
      };
    }
  };

});
