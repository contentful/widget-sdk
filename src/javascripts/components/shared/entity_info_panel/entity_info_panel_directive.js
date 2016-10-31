'use strict';

angular.module('contentful')
.directive('cfEntityInfoPanel', [function () {
  return {
    scope: {
      entity: '=',
      contentType: '=',
      user: '='
    },
    restrict: 'E',
    template: JST.entity_info_panel(),
    controller: ['$scope', function ($scope) {
      if ($scope.contentType) {
        $scope.contentTypeName = $scope.contentType.getName();
        $scope.contentTypeDescription = $scope.contentType.data.description;
      }

      $scope.$watch('entity.data.sys', function (sys) {
        $scope.sys = sys;
      }, true);
    }]
  };
}]);
