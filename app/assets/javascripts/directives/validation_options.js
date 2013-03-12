angular.module('contentful/directives').directive('validationOptions', function (otEditPathHelper) {
  'use strict';

  return {
    restrict: 'C',
    template: JST['validation_options'](),
    replace: true,
    scope: {
      validation: '=',
      doc: '=',
      validationIndex: '=',
      index: '=',
    },
    controller: function ($scope) {
      $scope.validationType = function (validation) {
        return _(validation).keys().filter(function(k) { return k !== '$$hashKey'; }).value()[0];
      };

      $scope.$watch('[index, validationIndex]', function (value, old, scope) {
        scope.path = ['fields', scope.index, 'validations', scope.validationIndex];
      }, true);
      otEditPathHelper.injectInto($scope);

      $scope.updateDoc = function () {
        $scope.changeValue($scope.validation);
      };

      $scope.$on('valueChanged', function (event, value) {
        $scope.validation = value;
      });
    }
  };

});
