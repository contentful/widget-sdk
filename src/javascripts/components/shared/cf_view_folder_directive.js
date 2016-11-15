'use strict';

angular.module('contentful')
.directive('cfViewFolder', function () {
  return {
    restrict: 'A',
    template: JST['cf_view_folder'](),
    controller: ['$scope', function ($scope) {
      $scope.$watch('folder.id', function (id) {
        $scope.regularFolder = id !== 'default';
      });
    }]
  };
});
