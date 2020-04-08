import React from 'react';
import ReactDOM from 'react-dom';
import { noop } from 'lodash';
import { registerDirective } from 'NgRegistry';
import createExtensionBridge from 'widgets/bridges/createExtensionBridge';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION, NAMESPACE_APP } from 'widgets/WidgetNamespaces';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';
import WidgetRenderWarning from 'widgets/WidgetRenderWarning';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer';

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
    '$rootScope',
    'spaceContext',
    '$controller',
    ($rootScope, spaceContext, $controller) => {
      return {
        scope: true,
        require: '?^cfWidgetApi',
        restrict: 'E',
        link: function (scope, element, _attrs, widgetApi) {
          const {
            widget,
            locale,
            editorData,
            loadEvents,
            widget: {
              problem,
              widgetNamespace,
              buildTemplate,
              renderFieldEditor,
              descriptor,
              renderWhen,
              parameters,
            },
          } = scope;

          const {
            createLinksRenderedEvent,
            createWidgetLinkRenderEventsHandler,
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
              trackLinksRendered,
            });
          }

          if (renderWhen) {
            renderWhen().then((config) => {
              renderEditorialComponent(config);
            });
          } else {
            renderEditorialComponent({ problem, buildTemplate, renderFieldEditor });
          }

          function renderEditorialComponent({ problem, buildTemplate, renderFieldEditor }) {
            if (problem) {
              trackLinksRendered();
              renderJsxTemplate(<WidgetRenderWarning message={problem}></WidgetRenderWarning>);
            } else if ([NAMESPACE_EXTENSION, NAMESPACE_APP].includes(widgetNamespace)) {
              trackLinksRendered();
              renderJsxTemplate(
                <ExtensionIFrameRenderer
                  descriptor={descriptor}
                  parameters={parameters}
                  bridge={createExtensionBridge({
                    $rootScope,
                    $scope: scope,
                    spaceContext,
                    $controller,
                  })}
                />
              );
            } else if (widgetNamespace === NAMESPACE_BUILTIN && buildTemplate) {
              if (!widgetApi) {
                throw new Error('widgetApi is unavailable in this context.');
              }
              handleWidgetLinkRenderEvents();
              const jsxTemplate = buildTemplate({
                widgetApi,
                loadEvents: loadEvents || newNoopLoadEvents(),
              });
              renderJsxTemplate(
                <WidgetAPIContext.Provider value={{ widgetApi }}>
                  {jsxTemplate}
                </WidgetAPIContext.Provider>
              );
            } else if (widgetNamespace === NAMESPACE_BUILTIN && renderFieldEditor) {
              const widgetApi = createNewWidgetApi({
                $scope: scope,
                spaceContext,
              });
              renderJsxTemplate(
                renderFieldEditor({
                  $scope: scope,
                  loadEvents: loadEvents || newNoopLoadEvents(),
                  widgetApi,
                })
              );
              handleWidgetLinkRenderEvents();
            } else {
              throw new Error('Builtin widget or a valid UI Extension is required.');
            }
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
        },
      };
    },
  ]);
}

function newNoopLoadEvents() {
  return {
    emit: () => {},
  };
}
