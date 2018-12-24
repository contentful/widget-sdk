import { registerDirective } from 'NgRegistry.es6';
import $ from 'jquery';

/**
 * @ngdoc directive
 * @name cfPositionRelativeToWidgetList
 * @description
 * This directive repositions the caret pointing at an item in the widget list
 * on two situations:
 * - When the selector for the selected widget in the list changes
 * - When the list is scrolled sideways
 *
 * @usage[html]
 * <cf-icon cf-position-relative-to-widget-list
 * position-relative-to=".selector[item-identifier=\"{{selectedWidgetIndex}}\"]"
 * reposition-when-scrolls=".widget-list"></cf-icon>
 *
 */
registerDirective('cfPositionRelativeToWidgetList', [
  'debounce',
  'defer',
  (debounce, defer) => ({
    restrict: 'A',
    link: function(_scope, elem, attrs) {
      defer(reposition);
      attrs.$observe('positionRelativeTo', reposition);

      const debouncedReposition = debounce(reposition, 50);
      $(attrs.repositionWhenScrolls).on('scroll', debouncedReposition);

      elem.on('$destroy', () => {
        $(attrs.repositionWhenScrolls).off('scroll', debouncedReposition);
      });

      function reposition() {
        const relativeTo = $(attrs.positionRelativeTo);
        if (relativeTo.get(0)) {
          const newMargin = relativeTo.position().left + relativeTo.width() / 2;
          elem.css('marginLeft', newMargin + 'px');
        }
      }
    }
  })
]);
