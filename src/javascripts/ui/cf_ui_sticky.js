'use strict';

/**
 * @ngdoc directive
 * @name cfUiSticky
 * @module cf.ui
 *
 * @description
 * Appends the class .fixed to the element if it should be pinned to the top of
 * the page - based on whether it's parent element is still in the viewport.
 * Assumes the `workbench` layout is being used.
 *
 * @usage[jade]
 * .container
 *   nav(cf-ui-sticky) Sticky nav bar
 *   div Some long content....
 */
angular.module('cf.ui')
.directive('cfUiSticky', function () {
  return {
    restrict: 'A',
    link: function (_scope, element) {
      var $element = $(element);
      var $parent = $element.parent();
      var $container = $element.closest('.workbench-main');
      var isFixed = false;

      $container.on('scroll', _.throttle(updatePosition, 100));

      function updatePosition () {
        var shouldFix = shouldElementBeFixed($parent);
        if (isFixed !== shouldFix) {
          _.once(insertPlaceholderElement)();
          isFixed = shouldFix;
          $element.toggleClass('fixed');
        }
      }

      // Ensures the height of the parent element stays the same
      function insertPlaceholderElement () {
        $element.wrap('<div style="height:' + $element.outerHeight(true) + 'px"></div>');
      }

      function shouldElementBeFixed ($el) {
        var rect = $el[0].getBoundingClientRect();
        return rect.top <= 63; // height of top nav bar
      }
    }
  };
});
