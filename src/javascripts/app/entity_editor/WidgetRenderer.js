import * as React from 'react';
import PropTypes from 'prop-types';
import { noop, defer } from 'lodash';
import WidgetRenderWarning from 'widgets/WidgetRenderWarning';
import {
  createLinksRenderedEvent,
  createWidgetLinkRenderEventsHandler,
} from 'app/entity_editor/LoadEventTracker';
import {
  WidgetNamespace,
  isCustomWidget,
  WidgetLocation,
  WidgetRenderer as WidgetRendererExternal,
} from '@contentful/widget-renderer';
import { toRendererWidget } from 'widgets/WidgetCompat';
import { buildOneRenderable } from '../../widgets/WidgetRenderable';
import getDefaultWidgetId from '../../widgets/DefaultWidget';
import { create as createBuiltinWidgetList } from '../../widgets/BuiltinWidgets';

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

const useTrackedRenderingType = ({ locale, loadEvents, widgetApi, widget }) => {
  const { problem, widgetNamespace } = widget;
  const isCustom = isCustomWidget(widgetNamespace);
  const isBuiltIn = widgetNamespace === WidgetNamespace.BUILTIN;

  // The rendering needs only to be tracked once
  React.useEffect(() => {
    const { trackLinksRendered, handleWidgetLinkRenderEvents } = getTrackingEvents({
      loadEvents,
      widget,
      locale,
      widgetApi,
    });
    if (isBuiltIn && !problem) {
      handleWidgetLinkRenderEvents();
    } else {
      // TODO: This is wrong, we have to check whether this is actually a link type field! Perhaps just send the
      //  field locale and ID and use a map to keep track of fields instead of a counter.

      // Custom widget renderer (app or ui-extension) that we can't measure or an issue (e.g. no widget renderer)
      trackLinksRendered();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { problem, isCustom, isBuiltIn };
};

function WidgetRendererInternal(props) {
  const { widget, entityType, locale, loadEvents, onFocus, onBlur, widgetApi } = props;

  const { problem, isBuiltIn, isCustom } = useTrackedRenderingType({
    locale,
    loadEvents,
    widgetApi,
    widget,
  });

  const [isRenderFallback, setIsRenderFallback] = React.useState(false);

  if (problem && isRenderFallback) {
    const defaultWidgetId = getDefaultWidgetId(widget.field, widget.field.id);

    const builtinWidgets = [...createBuiltinWidgetList()];

    return buildOneRenderable(
      {
        fieldId: widget.fieldId,
        widgetId: defaultWidgetId,
        widgetNamespace: WidgetNamespace.BUILTIN,
        field: widget.field,
      },
      builtinWidgets
    ).renderFieldEditor({
      loadEvents: loadEvents || newNoopLoadEvents(),
      widgetApi,
      entityType,
    });
  }

  if (problem) {
    return <WidgetRenderWarning setRenderFallback={setIsRenderFallback} message={widget.problem} />;
  }

  if (isCustom) {
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

  if (isBuiltIn) {
    return widget.renderFieldEditor({
      loadEvents: loadEvents || newNoopLoadEvents(),
      widgetApi,
      entityType,
    });
  }

  return null;
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

// NOTE The fileEditor widget renderer needs to be memoized due to
// some weird rerendering glitch that is related to the Angular/React mix
const MemoizedWidgetRendererInternal = React.memo(WidgetRendererInternal, (_, nextProps) => {
  const memoizedWidgetIds = ['fileEditor'];
  const shouldNotRerender = memoizedWidgetIds.includes(nextProps.widget.widgetId);
  return shouldNotRerender;
});

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
      <MemoizedWidgetRendererInternal {...props} />
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
