import * as React from 'react';
import PropTypes from 'prop-types';
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
  const { widget, locale, entityType, loadEvents, onFocus, onBlur, widgetApi } = props;
  const { problem, renderFieldEditor } = widget;

  let trackLinksRendered = noop;
  let handleWidgetLinkRenderEvents = noop;

  if (loadEvents) {
    trackLinksRendered = createLinksRenderedEvent(loadEvents);
    handleWidgetLinkRenderEvents = createWidgetLinkRenderEventsHandler({
      widget,
      locale,
      loadEvents,
      getValue: () => widgetApi.field.getValue(),
      trackLinksRendered,
    });
  }

  if (problem) {
    trackLinksRendered();
    return <WidgetRenderWarning message={problem} />;
  }

  if (isCustomWidget(widget.widgetNamespace)) {
    trackLinksRendered();
    return (
      <WidgetRendererExternal
        location={WidgetLocation.ENTRY_FIELD}
        widget={toRendererWidget(widget.descriptor)}
        sdk={widgetApi}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    );
  }

  if (widget.widgetNamespace === WidgetNamespace.BUILTIN) {
    const content = renderFieldEditor({
      loadEvents: loadEvents || newNoopLoadEvents(),
      widgetApi,
      entityType,
    });

    handleWidgetLinkRenderEvents();
    return content;
  }

  return null;
}

WidgetRendererInternal.propTypes = {
  locale: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired,
  loadEvents: PropTypes.object.isRequired,
  onBlur: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  widgetApi: PropTypes.object.isRequired,
  entityType: PropTypes.string.isRequired,
};

export function WidgetRenderer({ hasInitialFocus, isRtl, ...props }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (hasInitialFocus) {
      const input = ref.current?.querySelector('input');
      defer(() => input?.focus?.());
    }
  }, [hasInitialFocus, ref]);

  return (
    <div
      ref={ref}
      className={isRtl ? 'x--dir-rtl' : ''}
      onFocus={props.onFocus}
      onBlur={props.onBlur}>
      <WidgetRendererInternal {...props} />
    </div>
  );
}

WidgetRenderer.propTypes = {
  isRtl: PropTypes.bool.isRequired,
  hasInitialFocus: PropTypes.bool,
  locale: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  loadEvents: PropTypes.object.isRequired,
  widgetApi: PropTypes.object.isRequired,
  entityType: PropTypes.string.isRequired,
};
