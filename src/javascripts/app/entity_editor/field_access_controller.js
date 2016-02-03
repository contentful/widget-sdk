'use strict';

angular.module('contentful')
.controller('entityEditor/FieldAccessController',
['$scope', '$injector', function ($scope, $injector) {

  var accessChecker      = $injector.get('accessChecker');
  var fieldAccessChecker = accessChecker.getFieldChecker($scope.entity, isOtDocEditable);

  $scope.isEditable = fieldAccessChecker.isEditable;
  $scope.isDisabled = fieldAccessChecker.isDisabled;

  function isOtDocEditable() {
    return dotty.get($scope, 'otDoc.state.editable', false);
  }
}]);
