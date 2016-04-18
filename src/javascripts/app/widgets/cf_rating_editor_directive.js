'use strict';

angular.module('cf.app')
.directive('cfRatingEditor', [function(){
  return {
    restrict: 'E',
    scope: {},
    template: JST.cf_rating_editor(),
    require: '^cfWidgetApi',
    link: function ($scope, $el, attrs, widgetApi) {
      var field = widgetApi.field;
      var starCount = widgetApi.settings.stars;
      // Determines whether to highlight stars according to mouse
      // position
      var hovered = false;

      $scope.stars = _.map(_.range(starCount), function (index) {
        return {index: index + 1};
      });

      var removeChangeListener = field.onValueChanged(selectStars, true);

      var removeDisabledStatusListener = field.onDisabledStatusChanged(function (disabled) {
        $scope.isDisabled = disabled;
      }, true);

      $scope.$on('$destroy', function () {
        removeChangeListener();
        removeDisabledStatusListener();
      });

      $scope.setHovered = function (index) {
        if ($scope.isDisabled) {
          return;
        }

        _.forEach($scope.stars, function (star) {
          star.hovered = star.index <= index;
        });
        hovered = true;
      };

      $scope.unsetHovered = function () {
        _.forEach($scope.stars, function (star) {
          star.hovered = false;
        });
        hovered = false;
      };

      $scope.isActive = function (star) {
        return hovered ?
          star.hovered :
          star.selected;
      };

      $scope.setRating = function (rating) {
        if ($scope.isDisabled) {
          return;
        }

        field.setValue(rating);
        selectStars(rating);
      };

      $scope.clearRating = function () {
        field.removeValue();
        selectStars(null);
      };

      // 'rating' is a number or 'null' or 'undefined'
      function selectStars (rating) {
        $scope.hasRating = _.isNumber(rating);
        rating = _.isNumber(rating) ? rating : -1;

        _.forEach($scope.stars, function (star) {
          star.selected = star.index <= rating;
        });
      }
    }
  };
}]);
