import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import $ from 'jquery';
import { h } from 'utils/legacy-html-hyperscript/index.es6';

export default function register() {
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
  registerDirective('cfUiSticky', () => ({
    restrict: 'A',
    scope: {},
    link: function(_scope, element) {
      const $element = $(element);
      const $container = $element.closest('[cf-ui-sticky-container], body');

      const throttledUpdatePosition = _.throttle(updatePosition, 100);
      const insertPlaceholderElementOnce = _.memoize(insertPlaceholderElement);
      const memoizedGetDistanceFromTop = _.memoize(getDistanceFromTop);

      let isFixed = false;

      $container.on('scroll', throttledUpdatePosition);

      element.on('$destroy', throttledUpdatePosition.cancel);

      function updatePosition() {
        // Ensures that the DOM is loaded before height is calculated
        const $placeholder = insertPlaceholderElementOnce();

        const shouldFix = shouldElementBeFixed($placeholder);

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
        const newEl = h('div', {
          style: {
            height: $element.outerHeight(true) + 'px'
          }
        });
        $element.wrap(newEl);
        return $element.parent();
      }

      function shouldElementBeFixed($el) {
        const rect = $el[0].getBoundingClientRect();
        return rect.top < memoizedGetDistanceFromTop();
      }
    }
  }));
}
