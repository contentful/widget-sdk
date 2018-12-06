'use strict';

/**
 * @ngdoc directive
 * @name cfUiSticky
 * @module cf.ui
 *
 * @description
 * Appends the class .fixed to the element and adds `position: fixed` and sets the
 * top value if the element should be pinned to the top of the page based on the
 * scroll position of the container
 *
 * @usage[jade]
 * .container(cf-ui-sticky-container)
 *   section
 *     div First section
 *   section
 *     nav(cf-ui-sticky) Sticky nav bar
 *     div Some long content....
 */
angular.module('cf.ui').directive('cfUiSticky', [
  'require',
  require => {
    var $ = require('jquery');
    var h = require('utils/legacy-html-hyperscript').h;
    var _ = require('lodash');

    return {
      restrict: 'A',
      scope: {},
      link: function(_scope, element) {
        var $element = $(element);
        var $container = $element.closest('[cf-ui-sticky-container], body');

        var throttledUpdatePosition = _.throttle(updatePosition, 100);
        var insertPlaceholderElementOnce = _.memoize(insertPlaceholderElement);
        var memoizedGetDistanceFromTop = _.memoize(getDistanceFromTop);

        var isFixed = false;

        $container.on('scroll', throttledUpdatePosition);

        element.on('$destroy', throttledUpdatePosition.cancel);

        function updatePosition() {
          // Ensures that the DOM is loaded before height is calculated
          var $placeholder = insertPlaceholderElementOnce();

          var shouldFix = shouldElementBeFixed($placeholder);

          if (isFixed !== shouldFix) {
            isFixed = shouldFix;
            $element.css({
              top: isFixed ? memoizedGetDistanceFromTop() + 'px' : '',
              position: isFixed ? 'fixed' : ''
            });
            $element.toggleClass('fixed', isFixed);
          }
        }

        function getDistanceFromTop() {
          return $container[0].getBoundingClientRect().top;
        }

        // Ensures the height of the parent element stays the same
        function insertPlaceholderElement() {
          var newEl = h('div', {
            style: {
              height: $element.outerHeight(true) + 'px'
            }
          });
          $element.wrap(newEl);
          return $element.parent();
        }

        function shouldElementBeFixed($el) {
          var rect = $el[0].getBoundingClientRect();
          return rect.top < memoizedGetDistanceFromTop();
        }
      }
    };
  }
]);
