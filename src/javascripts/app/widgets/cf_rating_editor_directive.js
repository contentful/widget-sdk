'use strict';

angular.module('cf.app')
.directive('cfRatingEditor', [() => ({
  restrict: 'E',
  scope: {},
  template: JST.cf_rating_editor(),
  require: '^cfWidgetApi',

  link: function ($scope, _$el, _attrs, widgetApi) {
    var field = widgetApi.field;
    // Determines whether to highlight stars according to mouse
    // position
    var hovered = false;

    $scope.stars = _.map(_.range(getStarCount()), index => ({
      index: index + 1
    }));

    var removeChangeListener = field.onValueChanged(selectStars, true);

    var removeDisabledStatusListener = field.onIsDisabledChanged(disabled => {
      $scope.isDisabled = disabled;
    }, true);

    $scope.$on('$destroy', () => {
      removeChangeListener();
      removeDisabledStatusListener();
    });

    $scope.setHovered = index => {
      if ($scope.isDisabled) {
        return;
      }

      _.forEach($scope.stars, star => {
        star.hovered = star.index <= index;
      });
      hovered = true;
    };

    $scope.unsetHovered = () => {
      _.forEach($scope.stars, star => {
        star.hovered = false;
      });
      hovered = false;
    };

    $scope.isActive = star => hovered
      ? star.hovered
      : star.selected;

    $scope.setRating = rating => {
      if ($scope.isDisabled) {
        return;
      }

      field.setValue(rating);
      selectStars(rating);
    };

    $scope.clearRating = () => {
      field.removeValue();
      selectStars(null);
    };

    // 'rating' is a number or 'null' or 'undefined'
    function selectStars (rating) {
      $scope.hasRating = _.isNumber(rating);
      rating = _.isNumber(rating) ? rating : -1;

      _.forEach($scope.stars, star => {
        star.selected = star.index <= rating;
      });
    }

    // Star count is a setting coming from an editor interface.
    // Numerical values are used "as is" and strings are parsed.
    // We return whole positive numbers. If it's not possible to
    // convert to a valid value we use 5 as a default.
    function getStarCount () {
      var count = widgetApi.settings.stars;
      var defaultValue = 5;

      if (isValidCount(count)) {
        return Math.round(count);
      } else if (typeof count === 'string') {
        var parsed = parseInt(count, 10);
        return isValidCount(parsed) ? Math.round(parsed) : defaultValue;
      } else {
        return defaultValue;
      }
    }

    function isValidCount (count) {
      // Yes. `typeof n === 'number' && isNaN(n)` is `true`.
      return typeof count === 'number' && !isNaN(count) && count > 0;
    }
  }
})]);
