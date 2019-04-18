import React from 'react';
import ReactDOM from 'react-dom';
import { noop } from 'lodash';
import { registerDirective } from 'NgRegistry.es6';
import $ from 'jquery';
import createBridge from 'widgets/bridges/EditorExtensionBridge.es6';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index.es6';

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
    'entityCreator',
    'states/Navigator.es6',
    'app/entity_editor/LoadEventTracker.es6',
    (
      $compile,
      $rootScope,
      spaceContext,
      TheLocaleStore,
      entitySelector,
      entityCreator,
      Navigator,
      LoadEventTracker
    ) => {
      return {
        scope: true,
        require: '?^cfWidgetApi',
        restrict: 'E',
        link: function(scope, element, _attrs, widgetApi) {
          const {
            widget,
            locale,
            editorData,
            loadEvents,
            widget: { problem, widgetNamespace, template, buildTemplate, descriptor, parameters }
          } = scope;

          const {
            createLinksRenderedEvent,
            createWidgetLinkRenderEventsHandler
          } = LoadEventTracker;

          let trackLinksRendered = noop;
          let handleWidgetLinkRenderEvents = noop;
          if (loadEvents) {
            trackLinksRendered = createLinksRenderedEvent(loadEvents);
            handleWidgetLinkRenderEvents = createWidgetLinkRenderEventsHandler({
              widget,
              locale,
              loadEvents,
              editorData,
              trackLinksRendered
            });
          }

          if (problem) {
            scope.props = { message: problem };
            trackLinksRendered();
            renderTemplate(
              `<react-component name="widgets/WidgetRenderWarning.es6" props="props" />`
            );
          } else if (widgetNamespace === NAMESPACE_EXTENSION) {
            trackLinksRendered();
            renderExtension();
          } else if (widgetNamespace === NAMESPACE_BUILTIN && template) {
            handleWidgetLinkRenderEvents();
            renderTemplate(template);
          } else if (widgetNamespace === NAMESPACE_BUILTIN && buildTemplate) {
            if (!widgetApi) {
              throw new Error('widgetApi is unavailable in this context.');
            }
            handleWidgetLinkRenderEvents();
            const jsxTemplate = buildTemplate({
              widgetApi,
              loadEvents: loadEvents || newNoopLoadEvents()
            });
            renderJsxTemplate(
              <WidgetAPIContext.Provider value={{ widgetApi }}>
                {jsxTemplate}
              </WidgetAPIContext.Provider>
            );
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

          function renderJsxTemplate(jsx) {
            scope.$evalAsync(() => {
              ReactDOM.render(jsx, element[0]);
            });
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

function newNoopLoadEvents() {
  return {
    emit: () => {}
  };
}
