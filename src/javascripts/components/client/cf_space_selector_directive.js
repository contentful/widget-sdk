'use strict';

angular.module('contentful').directive('cfSpaceSelector', function() {
  return {
    template: JST.cf_space_selector(),
    restrict: 'E',
    replace: true,
    controller: ['$scope', function ($scope) {

      $scope.$watch('spaces.length', function (len) {
        $scope.hasSpaces = len && len > 0;
      });

      $scope.isCurrentSpace = function (space) {
        return space.getId() === $scope.getCurrentSpaceId();
      };

    }]
  };
});
