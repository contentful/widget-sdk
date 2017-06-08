angular.module('contentful')

/**
 * @ngdoc directive
 * @name uiOnScroll
 * @usage
 *   h('.scroll-container', {uiSetScroll: 'scrollValue'}, [
 *     // ...
 *   ])
 *
 * @description
 * Scrolls the element whenever the scope value referenced by the
 * attribute value changes.
 */
.directive('uiSetScroll', [function () {
  return {
    restrict: 'A',
    link: function ($scope, $elem, $attrs) {
      $scope.$watch($attrs.uiSetScroll, function (scrollTop) {
        if (_.isNumber(scrollTop)) {
          $scope.$applyAsync(function () {
            $elem.get(0).scrollTop = scrollTop;
          });
        }
      });
    }
  };
}]);
