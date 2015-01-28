'use strict';

angular.module('contentful').controller('cfLocationEditorController', ['$scope', function ($scope) {
  $scope.$watch('location', function(loc, old, scope) {
    scope.locationValid = scope.locationIsValid(loc);
  });

  $scope.locationIsValid = function (loc) {
    return angular.isObject(loc) && isNumber(loc.lat) && isNumber(loc.lon);
  };

  function isNumber(n) {
    return angular.isNumber(n) && !isNaN(n);
  }
}]);
