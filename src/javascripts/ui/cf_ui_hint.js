'use strict';

angular.module('cf.ui')

/**
 * @ngdoc directive
 * @name cfUiHint
 * @description
 * Displays a hint which can optionally show a hovering arrow, with a
 * transcluded message.
 *
 * arrow=true to show the arrow
 *
 * Each hint will need to set their own positioning and the message
 * positioning via CSS and should also be used inside a relatively or
 * absolutely positioned element.
 *
 *
 * @usage
 * // jade
 * cf-ui-hint(name="hint-name" arrow="true")
 *   This is a hint
 *
 * // stylus
 * .ui-hint
 *   top: 20px
 *   left: 60px
 *   p
 *     top: -5px
 *     left: 160px
*/
.directive('cfUiHint', ['hints', function (hints) {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    template:
      '<div class="ui-hint">'+
      '<cf-icon name="hint-arrow" ng-if="showArrow"></cf-icon>'+
      '<p ng-transclude class="ui-hint-content"></p>'+
      '</div>',
    compile: function (elem, attrs) {
      if (!hints.shouldShow(attrs.name)) {
        return function (scope, elem) {
          elem.remove();
        };
      } else {
        return function (scope, elem, attrs) {
          scope.showArrow = attrs.arrow;
          hints.setAsSeen(attrs.name);
        };
      }
    }
  };
}]);
