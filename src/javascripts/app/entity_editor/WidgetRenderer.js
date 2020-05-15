import * as React from 'react';
import PropTypes from 'prop-types';
import * as K from 'core/utils/kefir';
import { getModule } from 'core/NgRegistry';
import { noop, defer } from 'lodash';
import createExtensionBridge from 'widgets/bridges/createExtensionBridge';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION, NAMESPACE_APP } from 'widgets/WidgetNamespaces';
import WidgetRenderWarning from 'widgets/WidgetRenderWarning';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer';
import * as WidgetLocations from 'widgets/WidgetLocations';
import createNewWidgetApi from 'app/widgets/NewWidgetApi/createNewWidgetApi';
import * as LoadEventTracker from 'app/entity_editor/LoadEventTracker';

const { createLinksRenderedEvent, createWidgetLinkRenderEventsHandler } = LoadEventTracker;

function newNoopLoadEvents() {
  return {
    emit: () => {},
  };
}

function WidgetRendererInternal(props) {
  const { widget, locale, editorData, loadEvents } = props;
  const { problem, widgetNamespace, widgetId, renderFieldEditor, descriptor, parameters } = widget;

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

  if (problem) {
    trackLinksRendered();
    return <WidgetRenderWarning message={problem}></WidgetRenderWarning>;
  } else if ([NAMESPACE_EXTENSION, NAMESPACE_APP].includes(widgetNamespace)) {
    trackLinksRendered();
    const $rootScope = getModule('$rootScope');
    const spaceContext = getModule('spaceContext');
    const $controller = getModule('$controller');
    return (
      <ExtensionIFrameRenderer
        descriptor={descriptor}
        parameters={parameters}
        bridge={createExtensionBridge({
          $rootScope,
          $scope: props.scope,
          spaceContext,
          $controller,
          currentWidgetId: widgetId,
          currentWidgetNamespace: widgetNamespace,
          location: WidgetLocations.LOCATION_ENTRY_FIELD,
        })}
      />
    );
  } else if (widgetNamespace === NAMESPACE_BUILTIN) {
    const spaceContext = getModule('spaceContext');

    const widgetApi = createNewWidgetApi({
      $scope: props.scope,
      spaceContext,
    });

    const widget = renderFieldEditor({
      $scope: props.scope,
      loadEvents: loadEvents || newNoopLoadEvents(),
      widgetApi,
    });

    handleWidgetLinkRenderEvents();

    return widget;
  }

  return null;
}

WidgetRendererInternal.propTypes = {
  scope: PropTypes.object.isRequired,
  locale: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired,
  editorData: PropTypes.object.isRequired,
  loadEvents: PropTypes.object.isRequired,
};

export function WidgetRenderer(props) {
  const { widget, locale, editorData, loadEvents } = props.scope;
  const ref = React.createRef();

  React.useEffect(() => {
    if (props.hasInitialFocus) {
      K.onValueScope(props.scope, props.scope.otDoc.state.loaded$, (loaded) => {
        if (loaded) {
          const input = ref.current.querySelector('input');
          if (input && typeof input.focus === 'function') {
            defer(() => {
              input.focus();
            });
          }
        }
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={ref}
      className={props.isRtl ? 'x--dir-rtl' : ''}
      onFocus={() => {
        props.scope.$applyAsync(() => {
          props.scope.fieldLocale.setActive(true);
        });
      }}
      onBlur={() => {
        props.scope.$applyAsync(() => {
          props.scope.fieldLocale.setActive(false);
          props.scope.fieldLocale.revalidate();
        });
      }}>
      <WidgetRendererInternal
        widget={widget}
        locale={locale}
        editorData={editorData}
        loadEvents={loadEvents}
        scope={props.scope}
      />
    </div>
  );
}

WidgetRenderer.propTypes = {
  hasInitialFocus: PropTypes.bool.isRequired,
  isRtl: PropTypes.bool.isRequired,
  scope: PropTypes.object.isRequired,
};