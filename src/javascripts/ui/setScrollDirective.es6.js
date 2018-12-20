import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';

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
registerDirective('uiSetScroll', () => ({
  restrict: 'A',

  link: function($scope, $elem, $attrs) {
    $scope.$watch($attrs.uiSetScroll, scrollTop => {
      if (_.isNumber(scrollTop)) {
        $scope.$applyAsync(() => {
          $elem.get(0).scrollTop = scrollTop;
        });
      }
    });
  }
}));
