import * as React from 'react';
import PropTypes from 'prop-types';
import { noop, defer } from 'lodash';
import WidgetRenderWarning from 'widgets/WidgetRenderWarning';
import {
  createLinksRenderedEvent,
  createWidgetLinkRenderEventsHandler,
} from 'app/entity_editor/LoadEventTrackerNew';
import {
  WidgetNamespace,
  isCustomWidget,
  WidgetLocation,
  WidgetRenderer as WidgetRendererExternal,
} from '@contentful/widget-renderer';
import { toRendererWidget } from 'widgets/WidgetCompat';

function newNoopLoadEvents() {
  return {
    emit: () => {},
  };
}

function getTrackingEvents({ loadEvents, widget, locale, widgetApi }) {
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
  return {
    handleWidgetLinkRenderEvents,
    trackLinksRendered,
  };
}

function WidgetRendererInternal(props) {
  const { widget, locale, entityType, loadEvents, onFocus, onBlur, widgetApi } = props;

  // NOTE The widget renderer need to be memoized, as they suffer of race conditions when rendered multiple times
  return React.useMemo(() => {
    const { problem, renderFieldEditor } = widget;
    const { trackLinksRendered, handleWidgetLinkRenderEvents } = getTrackingEvents({
      loadEvents,
      widget,
      locale,
      widgetApi,
    });

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
      handleWidgetLinkRenderEvents();
      return renderFieldEditor({
        loadEvents: loadEvents || newNoopLoadEvents(),
        widgetApi,
        entityType,
      });
    }
    return null;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

WidgetRendererInternal.propTypes = {
  locale: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired,
  loadEvents: PropTypes.object,
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
  loadEvents: PropTypes.object,
  widgetApi: PropTypes.object.isRequired,
  entityType: PropTypes.string.isRequired,
};
