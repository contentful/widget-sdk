import { registerDirective } from 'NgRegistry.es6';
import $ from 'jquery';
import createBridge from 'widgets/EditorExtensionBridge.es6';

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
    'Config.es6',
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
      Config,
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
          const { custom, template, src, srcdoc } = scope.widget;

          if (custom) {
            renderExtension();
          } else if (template) {
            renderTemplate(template);
          } else {
            throw new Error('Widget template or custom extension is required');
          }

          function renderExtension() {
            scope.props = {
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
              }),
              src,
              srcdoc,
              appDomain: `app.${Config.domain}`
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
