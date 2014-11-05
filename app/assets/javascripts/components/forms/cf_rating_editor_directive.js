'use strict';

angular.module('contentful').directive('cfRatingEditor', ['$injector', function($injector){
  return {
    restrict: 'E',
    scope: true,
    template: JST['cf_rating_editor'](),
    link: function (scope, elem) {
      elem.on('mouseleave', removePending);

      scope.$on('$destroy', function () {
        elem.off('mouseleave', removePending);
      });

      function removePending() {
        scope.$apply(function (scope) {
          scope.setPending(null);
        });
      }
    },
    controller: ['$scope', function ($scope) {
      $scope.$watch('widget.widgetParams.stars', setStars);
      $scope.pendingValue = -1;

      $scope.setPending = setPending;
      $scope.setRating  = setRating;

      $scope.hasRating = function () {
        return _.isNumber($scope.rating) && $scope.rating > 0;
      };

      function setPending(index) {
        index = index === null ? -1 : index;
        $scope.pendingValue = index;
      }

      function setRating(index) {
        if (_.isNumber(index)) {
          $scope.rating = index + 1;
        } else {
          $scope.rating = index;
        }
        $scope.otBindInternalChangeHandler();
      }

      function setStars(numStars) {
        $scope.stars = $scope.stars || [];
        $scope.stars.length = parseInt(numStars) || 10;
      }
    }]
  };
}]);
