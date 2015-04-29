'use strict';

/**
 * @ngdoc directive
 * @name uiSortable
 * @module cf.ui
 *
 * @description
 * Adds user interactions for rearranging a list
 *
 * ~~~jade
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
 * ~~~
 */
// The actual heavy lifiting is done by the ui.sortable module.
angular.module('cf.ui')
.directive('cfUiSortable', ['uiSortableDirective', function(uiSortableDirectives) {
  var uiSortable = uiSortableDirectives[0];
  return {
    restrict: 'A',
    require: '?ngModel',
    scope: {
      ngModel: '=',
    },
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

