import * as React from 'react';
import PropTypes from 'prop-types';
import * as K from 'core/utils/kefir';
import { noop, defer } from 'lodash';
import WidgetRenderWarning from 'widgets/WidgetRenderWarning';
import * as LoadEventTracker from 'app/entity_editor/LoadEventTracker';
import { WidgetNamespace, isCustomWidget, WidgetLocation } from '@contentful/widget-renderer';
import { toRendererWidget } from 'widgets/WidgetCompat';
import { WidgetRenderer as WidgetRendererExternal } from '@contentful/widget-renderer';

const { createLinksRenderedEvent, createWidgetLinkRenderEventsHandler } = LoadEventTracker;

function newNoopLoadEvents() {
  return {
    emit: () => {},
  };
}

function WidgetRendererInternal(props) {
  const { widget, locale, editorData, loadEvents } = props;
  const { problem, renderFieldEditor } = widget;

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
    return <WidgetRenderWarning message={problem} />;
  } else if (isCustomWidget(widget.widgetNamespace)) {
    trackLinksRendered();
    return (
      <WidgetRendererExternal
        location={WidgetLocation.ENTRY_FIELD}
        widget={toRendererWidget(widget.descriptor)}
        sdk={props.widgetApi}
        onFocus={() => props.scope.fieldLocale.setActive(true)}
        onBlur={() => props.scope.fieldLocale.setActive(false)}
      />
    );
  } else if (widget.widgetNamespace === WidgetNamespace.BUILTIN) {
    const content = renderFieldEditor({
      $scope: props.scope,
      loadEvents: loadEvents || newNoopLoadEvents(),
      widgetApi: props.widgetApi,
      entityType: editorData.entityInfo.type,
    });

    handleWidgetLinkRenderEvents();

    return content;
  }

  return null;
}

WidgetRendererInternal.propTypes = {
  scope: PropTypes.object.isRequired,
  locale: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired,
  editorData: PropTypes.object.isRequired,
  loadEvents: PropTypes.object.isRequired,
  widgetApi: PropTypes.object.isRequired,
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
        widgetApi={props.widgetApi}
        scope={props.scope}
      />
    </div>
  );
}

WidgetRenderer.propTypes = {
  hasInitialFocus: PropTypes.bool.isRequired,
  isRtl: PropTypes.bool.isRequired,
  scope: PropTypes.object.isRequired,
  widgetApi: PropTypes.object.isRequired,
};
