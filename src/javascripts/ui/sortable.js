'use strict';

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
 * [ui-sortable]: https://github.com/angular-ui/ui-sortable
 *
 * @usage[jade]
 * ul(ui-sortable)
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
angular.module('cf.ui')
.directive('cfUiSortable', ['uiSortableDirective', function(uiSortableDirectives) {
  var uiSortable = uiSortableDirectives[0];
  return {
    restrict: 'A',
    require: '?ngModel',
    scope: true,
    link: function link (scope, element, attrs, ngModel) {
      scope.uiSortable = {
        handle: '[data-drag-handle]',
        item: '*:not([data-no-drag])',
        axis: 'y',
      };
      uiSortable.link(scope, element, attrs, ngModel);
    }
  };
}]);

