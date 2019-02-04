import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';

export default function register() {
  /**
   * @ngdoc directive
   * @name uiSortable
   * @module cf.ui
   *
   * @description
   * Adds user interactions for rearranging a list vertically.
   *
   * The actual heavy lifiting is done by the
   * [`ui.sortable`][ui-sortable] module.
   *
   * The is configured through the `scope.uiSortable` object. In addition
   * to the JQuery UI options it allows the `noForceSize` option which
   * prevents the directive from fixing the size of the dragged object.
   * This is to prevent some issues with fractional pixel values.
   *
   * [ui-sortable]: https://github.com/angular-ui/ui-sortable
   *
   * @usage[jade]
   * ul(cf-ui-sortable)
   *   li
   *     | Item 1
   *     a(data-drag-handle)
   *   li
   *     | Item 2
   *     a(data-drag-handle)
   *   li(data-no-drag)
   *     | This cannot be dragged
   *     a(data-drag-handle)
   */
  registerDirective('cfUiSortable', [
    'uiSortableDirective',
    uiSortableDirectives => {
      const uiSortable = uiSortableDirectives[0];

      const DEFAULTS = {
        handle: '[data-drag-handle]',
        item: '*:not([data-no-drag])',
        items: '> *',
        start: function(_event, ui) {
          // Placeholder should have the width of the original element
          ui.placeholder.css('width', ui.helper.outerWidth());

          // Do not force the height of the dragged item and be more
          // generous with the width. This prevents issues when the
          // width is a fraction of the pixel and would lead to text
          // being broken into the next line
          const width = parseFloat(ui.helper.css('width'));
          ui.helper.css({
            width: width + 1,
            height: ''
          });
        },
        forcePlaceholderSize: true,
        placeholder: 'sortable-placeholder'
      };

      return {
        restrict: 'A',
        require: '?ngModel',
        scope: true,
        link: function link(scope, element, attrs, ngModel) {
          scope.uiSortable = _.defaults(scope.uiSortable || {}, DEFAULTS);
          uiSortable.link(scope, element, attrs, ngModel);
        }
      };
    }
  ]);
}
