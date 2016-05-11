'use strict';

angular.module('contentful')
// TODO Remove this controller. The provided scope API is only used in
// legacy widgets. Also make sure to remove the unused second argument
// of the `getFieldChecker()` method.
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
