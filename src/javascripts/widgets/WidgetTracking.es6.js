import { get } from 'lodash';
import { getSchema } from 'analytics/snowplow/Schemas.es6';
import { NAMESPACE_EXTENSION } from './WidgetNamespaces.es6';
import { toInternalFieldType } from './FieldTypes.es6';
import * as WidgetLocations from './WidgetLocations.es6';

export function getWidgetTrackingContexts(editorData) {
  return [...getExtensionTrackingContexts(editorData), getSidebarTrackingContext(editorData)];
}

function getExtensionTrackingContexts(editorData) {
  const schema = getSchema('extension_render').path;

  const extensionsByLocation = {
    [WidgetLocations.LOCATION_ENTRY_FIELD]: getExtensions(editorData, ['fieldControls', 'form']),
    [WidgetLocations.LOCATION_ENTRY_FIELD_SIDEBAR]: getExtensions(editorData, [
      'fieldControls',
      'sidebar'
    ]),
    [WidgetLocations.LOCATION_ENTRY_SIDEBAR]: getExtensions(editorData, ['sidebarExtensions'])
  };

  return Object.keys(extensionsByLocation).reduce(
    (acc, location) => [
      ...acc,
      ...extensionsByLocation[location].reduce(
        (acc, widget) => [...acc, { schema, data: makeExtensionEventData(location, widget) }],
        []
      )
    ],
    []
  );
}

function makeExtensionEventData(location, widget) {
  return {
    location,
    extension_id: get(widget, ['descriptor', 'id']),
    extension_name: get(widget, ['descriptor', 'name']),
    // Until schema reaches 2.0 both `field_id` and `field_type` need
    // to be empty strings if the extension is not rendered for a field.
    field_id: typeof widget.fieldId === 'string' ? widget.fieldId : '',
    field_type: widget.field ? toInternalFieldType(widget.field) : '',
    installation_params: Object.keys(widget.installationParameterValues),
    instance_params: Object.keys(widget.settings),
    sidebar: !!widget.sidebar,
    src: typeof widget.src === 'string' ? widget.src : null
  };
}

function getSidebarTrackingContext(editorData) {
  const schema = getSchema('sidebar_render').path;

  const legacySidebarExtensions = getExtensions(editorData, ['fieldControls', 'sidebar']);
  const has_legacy_extensions = legacySidebarExtensions.length > 0;

  const sidebar = get(editorData, ['editorInterface', 'sidebar']);

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

function getExtensions(editorData, path) {
  const locationWidgets = get(editorData, path);
  if (Array.isArray(locationWidgets)) {
    return locationWidgets.filter(w => w.widgetNamespace === NAMESPACE_EXTENSION);
  } else {
    return [];
  }
}
