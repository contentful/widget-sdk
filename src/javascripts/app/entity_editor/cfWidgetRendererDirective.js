import React from 'react';
import ReactDOM from 'react-dom';
import { noop } from 'lodash';
import { registerDirective } from 'NgRegistry';
import $ from 'jquery';
import createExtensionBridge from 'widgets/bridges/createExtensionBridge';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION, NAMESPACE_APP } from 'widgets/WidgetNamespaces';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';

import createNewWidgetApi from 'app/widgets/NewWidgetApi/createNewWidgetApi';
import * as LoadEventTracker from 'app/entity_editor/LoadEventTracker';

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
    ($compile, $rootScope, spaceContext) => {
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
            widget: {
              problem,
              widgetNamespace,
              template,
              buildTemplate,
              renderFieldEditor,
              descriptor,
              renderWhen,
              parameters
            }
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

          if (renderWhen) {
            renderWhen().then(config => {
              renderEditorialComponent(config);
            });
          } else {
            renderEditorialComponent({ problem, template, buildTemplate, renderFieldEditor });
          }

          function renderEditorialComponent({
            problem,
            template,
            buildTemplate,
            renderFieldEditor
          }) {
            if (problem) {
              scope.props = { message: problem };
              trackLinksRendered();
              renderTemplate(
                `<react-component name="widgets/WidgetRenderWarning" props="props" />`
              );
            } else if ([NAMESPACE_EXTENSION, NAMESPACE_APP].includes(widgetNamespace)) {
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
            } else if (widgetNamespace === NAMESPACE_BUILTIN && renderFieldEditor) {
              renderJsxTemplate(
                renderFieldEditor({
                  $scope: scope,
                  widgetApi: createNewWidgetApi({
                    $scope: scope,
                    spaceContext
                  })
                })
              );
              handleWidgetLinkRenderEvents();
            } else {
              throw new Error('Builtin widget template or a valid UI Extension is required.');
            }
          }

          function renderExtension() {
            scope.props = {
              descriptor,
              parameters,
              bridge: createExtensionBridge({
                $rootScope,
                $scope: scope,
                spaceContext
              })
            };

            renderTemplate(
              '<react-component name="widgets/ExtensionIFrameRenderer" props="props" />'
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
