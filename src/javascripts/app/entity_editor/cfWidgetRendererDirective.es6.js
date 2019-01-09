import { registerDirective } from 'NgRegistry.es6';
import $ from 'jquery';

/**
 * @ngdoc directive
 * @module cf.app
 * @name cfWidgetRenderer
 * @description
 * Render the widget template in the element.
 *
 * @scope.requires {Widget.Renderable} widget
 * @scope.requires {Client.ContentType?} contentType
 * @scope.requires {FieldLocaleController} fieldLocale
 */
registerDirective('cfWidgetRenderer', [
  '$compile',
  $compile => {
    return {
      scope: true,
      restrict: 'E',
      link: function(scope, element) {
        const template = scope.widget.template;
        if (!template) {
          throw new Error('Widget template is required');
        }

        const $widget = $(template);
        element.append($widget);
        $compile($widget)(scope);

        element.on('focusin', () => {
          scope.$applyAsync(() => {
            scope.fieldLocale.setActive(true);
          });
        });

        element.on('focusout', () => {
          scope.$applyAsync(() => {
            scope.fieldLocale.setActive(false);
            scope.fieldLocale.revalidate();
          });
        });
      }
    };
  }
]);
