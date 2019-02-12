import { registerDirective } from 'NgRegistry.es6';
import $ from 'jquery';
import createBridge from 'widgets/EditorExtensionBridge.es6';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';

export default function register() {
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
    '$rootScope',
    'spaceContext',
    'TheLocaleStore',
    'entitySelector',
    'analytics/Analytics.es6',
    'entityCreator',
    'states/Navigator.es6',
    'navigation/SlideInNavigator',
    (
      $compile,
      $rootScope,
      spaceContext,
      TheLocaleStore,
      entitySelector,
      Analytics,
      entityCreator,
      Navigator,
      SlideInNavigator
    ) => {
      return {
        scope: true,
        restrict: 'E',
        link: function(scope, element) {
          const { problem, widgetNamespace, template, descriptor, parameters } = scope.widget;

          if (problem) {
            scope.props = { message: problem };
            renderTemplate(
              `<react-component name="widgets/WidgetRenderWarning.es6" props="props" />`
            );
          } else if (widgetNamespace === NAMESPACE_EXTENSION) {
            renderExtension();
          } else if (widgetNamespace === NAMESPACE_BUILTIN && template) {
            renderTemplate(template);
          } else {
            throw new Error('Builtin widget template or a valid UI Extension is required.');
          }

          function renderExtension() {
            scope.props = {
              descriptor,
              parameters,
              bridge: createBridge({
                $rootScope,
                $scope: scope,
                spaceContext,
                TheLocaleStore,
                entitySelector,
                Analytics,
                entityCreator,
                Navigator,
                SlideInNavigator
              })
            };

            renderTemplate(
              '<react-component name="widgets/ExtensionIFrameRenderer.es6" props="props" />'
            );
          }

          function renderTemplate(template) {
            const $widget = $(template);
            element.append($widget);
            $compile($widget)(scope);
            setupFocus();
          }

          function setupFocus() {
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
        }
      };
    }
  ]);
}
