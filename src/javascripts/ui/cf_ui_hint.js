'use strict';

angular.module('cf.ui')

/**
 * @ngdoc directive
 * @name cfUiHint
 * @description
 * Displays a hint which can optionally show an arrow and dismiss link, with a
 * transcluded message.
 *
 * The directive queries the 'hints' service and the 'name' attribute
 * to determine if the hint should be shown. A hint with a given name
 * will only be shown once.
 *
 * @param {string} name
 *
 * @param {boolean} arrow
 * Show the arrow
 *
 * @param {string{up, down, left, right}} arrow-direction
 * Paints an arrow pointing in the given direction.
 * It will apply only if arrow param is "true".
 *
 * @param {boolean} show-dismiss
 * Shows a dismiss link that will close the hint.
 *
 * Each hint will need to set their own positioning via CSS.
 * The message inside defaults to relative positioning. It can be
 * modified using CSS if necessary.
 *
 * The arrow is absolutely positioned and thus you will have to specify
 * it's position using CSS if you use an arrow.
 *
 *
 * @usage
 * // jade
 * cf-ui-hint(name="hint-name" arrow="true" arrow-direction="up" show-dismiss="true")
 *   | This is a hint
 *
 * // stylus
 * .ui-hint
 *   top: 20px
 *   left: 60px
 *   .ui-hint-content
 *     margin-bottom: 0
 *   [data-arrow-direction="up"]
 *     top: -7px
*/
.directive('cfUiHint', ['require', require => {
  var Hints = require('hints');
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    scope: {
      arrowDirection: '@',
      showArrow: '@arrow',
      showDismiss: '@',
      name: '@'
    },
    template:
      '<div class="ui-hint" data-test-id="{{name}}" role="note">' +
      '<span data-arrow-direction="{{arrowDirection}}" ng-if="showArrow"></span>' +
      '<p ng-transclude class="ui-hint-content"></p>' +
      '<a class="ui-hint__dismiss" ng-if="showDismiss" role="button" data-test-id="ui-hint-dismiss-btn" aria-label="ui-hint-dismiss-btn">Dismiss</a>' +
      '</div>',
    compile: function (_, attrs) {
      if (Hints.shouldShow(attrs.name)) {
        return (scope, elem) => {
          var $elem = $(elem);

          Hints.setAsSeen(scope.name);

          if (scope.showDismiss) {
            $elem.on('click', '[data-test-id="ui-hint-dismiss-btn"]', $elem.fadeOut.bind($elem));
          }
        };
      } else {
        return (_, elem) => {
          elem.remove();
        };
      }
    }
  };
}]);
