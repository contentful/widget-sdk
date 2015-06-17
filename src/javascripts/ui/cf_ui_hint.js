'use strict';

angular.module('cf.ui')

/**
 * @ngdoc directive
 * @name cfUiHint
 * @description
 * Shows an hovering hint with an arrow, with a transcluded message
 *
 * Each hint will need to set their own positioning and the message positioning via CSS
 * and should also be used inside a relatively or absolutely positioned element.
 *
 * @usage
 * // jade
 * cf-ui-hint(name="hint-name"
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
      '<cf-icon name="hint-arrow"></cf-icon>'+
      '<p><ng-transclude /></p>'+
      '</div>',
    compile: function (elem, attrs) {
      if(!hints.shouldShow(attrs.name)){
        return function (scope, elem){
          elem.remove();
        };
      } else {
        return function (scope, elem, attrs) {
          hints.setAsSeen(attrs.name);
        };
      }
    }
  };
}]);
