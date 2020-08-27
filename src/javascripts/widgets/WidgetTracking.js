import { get, identity } from 'lodash';
import { getSchema } from 'analytics/Schemas';
import { makeEventFromWidget } from './TrackExtensionRender';
import { WidgetLocation, isCustomWidget } from '@contentful/widget-renderer';

// Arguments are expected to be produced in `app/entity_editor/DataLoader#loadEditorData()`.
export function getWidgetTrackingContexts(
  { fieldControls, sidebar, sidebarExtensions, editorsExtensions },
  environmentId
) {
  return [
    ...getExtensionTrackingContexts(
      { fieldControls, sidebarExtensions, editorsExtensions },
      environmentId
    ),
    getSidebarTrackingContext({ fieldControls, sidebar }),
  ];
}

function getExtensionTrackingContexts(
  { fieldControls, sidebarExtensions, editorsExtensions },
  environmentId
) {
  const extensionsByLocation = {
    [WidgetLocation.ENTRY_FIELD]: getExtensions(fieldControls, ['form']),
    [WidgetLocation.ENTRY_FIELD_SIDEBAR]: getExtensions(fieldControls, ['sidebar']),
    [WidgetLocation.ENTRY_SIDEBAR]: getExtensions(sidebarExtensions),
    [WidgetLocation.ENTRY_EDITOR]: getExtensions(editorsExtensions),
  };

  return Object.keys(extensionsByLocation).reduce(
    (acc, location) => [
      ...acc,
      ...extensionsByLocation[location].reduce(
        (acc, widget) => [...acc, makeExtensionEvent(location, widget, environmentId)],
        []
      ),
    ],
    []
  );
}

function makeExtensionEvent(location, widget, environmentId) {
  return {
    schema: getSchema('extension_render').path,
    data: makeEventFromWidget(location, widget, environmentId),
  };
}

function getSidebarTrackingContext({ fieldControls, sidebar }) {
  const schema = getSchema('sidebar_render').path;

  const legacySidebarExtensions = getExtensions(fieldControls, ['sidebar']);
  const has_legacy_extensions = legacySidebarExtensions.length > 0;

  if (!Array.isArray(sidebar)) {
    return {
      schema,
      data: { is_default: true, has_legacy_extensions, widgets: null },
    };
  }

  return {
    schema,
    data: {
      is_default: false,
      has_legacy_extensions,
      widgets: sidebar.map((item) => {
        return { widget_id: item.widgetId, widget_namespace: item.widgetNamespace };
      }),
    },
  };
}

function getExtensions(container, path) {
  const locationWidgets = Array.isArray(path) ? get(container, path) : container;

  if (Array.isArray(locationWidgets)) {
    return locationWidgets.filter(identity).filter((w) => isCustomWidget(w.widgetNamespace));
  } else {
    return [];
  }
}
