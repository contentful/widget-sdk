import { get, identity } from 'lodash';
import { getSchema } from 'analytics/Schemas';
import { NAMESPACE_EXTENSION } from './WidgetNamespaces';
import * as WidgetLocations from './WidgetLocations';
import { makeEventFromWidget } from './TrackExtensionRender';

// Arguments are expected to be produced in `app/entity_editor/DataLoader#loadEditorData()`.
export function getWidgetTrackingContexts({
  fieldControls,
  sidebar,
  sidebarExtensions,
  editorExtension
}) {
  return [
    ...getExtensionTrackingContexts({ fieldControls, sidebarExtensions, editorExtension }),
    getSidebarTrackingContext({ fieldControls, sidebar })
  ];
}

function getExtensionTrackingContexts({ fieldControls, sidebarExtensions, editorExtension }) {
  const extensionsByLocation = {
    [WidgetLocations.LOCATION_ENTRY_FIELD]: getExtensions(fieldControls, ['form']),
    [WidgetLocations.LOCATION_ENTRY_FIELD_SIDEBAR]: getExtensions(fieldControls, ['sidebar']),
    [WidgetLocations.LOCATION_ENTRY_SIDEBAR]: getExtensions(sidebarExtensions),
    [WidgetLocations.LOCATION_ENTRY_EDITOR]: getExtensions([editorExtension])
  };

  return Object.keys(extensionsByLocation).reduce(
    (acc, location) => [
      ...acc,
      ...extensionsByLocation[location].reduce(
        (acc, widget) => [...acc, makeExtensionEvent(location, widget)],
        []
      )
    ],
    []
  );
}

function makeExtensionEvent(location, widget) {
  return {
    schema: getSchema('extension_render').path,
    data: makeEventFromWidget(location, widget)
  };
}

function getSidebarTrackingContext({ fieldControls, sidebar }) {
  const schema = getSchema('sidebar_render').path;

  const legacySidebarExtensions = getExtensions(fieldControls, ['sidebar']);
  const has_legacy_extensions = legacySidebarExtensions.length > 0;

  if (!Array.isArray(sidebar)) {
    return {
      schema,
      data: { is_default: true, has_legacy_extensions, widgets: null }
    };
  }

  return {
    schema,
    data: {
      is_default: false,
      has_legacy_extensions,
      widgets: sidebar.map(item => {
        return { widget_id: item.widgetId, widget_namespace: item.widgetNamespace };
      })
    }
  };
}

function getExtensions(container, path) {
  const locationWidgets = Array.isArray(path) ? get(container, path) : container;

  if (Array.isArray(locationWidgets)) {
    return locationWidgets.filter(identity).filter(w => w.widgetNamespace === NAMESPACE_EXTENSION);
  } else {
    return [];
  }
}
