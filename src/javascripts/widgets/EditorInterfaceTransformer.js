import { cloneDeep } from 'lodash';
import { migrateControl, WIDGET_MIGRATIONS } from './ControlMigrations';
import getDefaultWidgetId from './DefaultWidget';
import { NAMESPACE_BUILTIN, NAMESPACE_EXTENSION } from './WidgetNamespaces';
import { create as createBuiltinWidgetList } from './BuiltinWidgets';

const NAMESPACES = [NAMESPACE_BUILTIN, NAMESPACE_EXTENSION];

const isNonEmptyString = s => typeof s === 'string' && s.length > 0;

// Given a content type and its existing controls return
// synced controls as described in code comments below.
export function syncControls(ct, controls) {
  // Controls are ordered as the content type fields are.
  return (ct.fields || []).map(field => {
    // Find an existing control for a field.
    const fieldId = field.apiName || field.id;
    const existingControl = (controls || []).find(c => c.fieldId === fieldId);

    // If found, use it. If not, create a default for the field type.
    const control = existingControl ? cloneDeep(existingControl) : makeDefaultControl(ct, field);

    // Determine a namespace to be used.
    control.widgetNamespace = determineNamespace(control);

    // If the widget ID or namespace are clearly invalid, use the default widget.
    const hasValidWidgetId = isNonEmptyString(control.widgetId);
    const hasValidNamespace = NAMESPACES.includes(control.widgetNamespace);
    if (!hasValidWidgetId || !hasValidNamespace) {
      control.widgetNamespace = NAMESPACE_BUILTIN;
      control.widgetId = getDefaultWidgetId(field, ct.displayField);
    }

    // Attach the content type field to the control.
    control.field = cloneDeep(field);

    // Migrate control if needed.
    control.widgetId = migrateControl(control);

    return control;
  });
}

function determineNamespace({ widgetNamespace, widgetId }) {
  // If a namespace is provided, use it.
  if (isNonEmptyString(widgetNamespace)) {
    return widgetNamespace;
  }

  // If there is or was (deprecation) a builtin widget for
  // the given ID assume the "builtin" namespace. Use the
  // "extension" namespace otherwise.
  const builtinWidgetIds = createBuiltinWidgetList().map(({ id }) => id);
  const deprecatedBuiltinWidgetIds = WIDGET_MIGRATIONS.map(({ from }) => from);
  const allBuiltinWidgetIds = [...builtinWidgetIds, ...deprecatedBuiltinWidgetIds];
  const isBuiltinWidget = !!allBuiltinWidgetIds.find(id => id === widgetId);

  return isBuiltinWidget ? NAMESPACE_BUILTIN : NAMESPACE_EXTENSION;
}

// Given an API editor interface entity convert it to our
// internal representation as described in `syncControls`.
export function fromAPI(ct, ei) {
  return {
    sys: ei.sys,
    controls: syncControls(ct, ei.controls),
    sidebar: ei.sidebar,
    editor: ei.editor
  };
}

// Given an internal representation of an editor interface
// prepares it to be stored in the API.
export function toAPI(ct, ei) {
  return {
    sys: ei.sys,
    controls: syncControls(ct, ei.controls).map(c => prepareAPIControl(c)),
    sidebar: ei.sidebar,
    editor: ei.editor
  };
}

// Given an internal representation of a control prepares
// a control to be stored in the API by selecting only properties
// accepted by the API.
function prepareAPIControl({ fieldId, widgetId, widgetNamespace, settings }) {
  const settingsValid = typeof settings === 'object' && settings !== null;
  const hasSettings = settingsValid && Object.keys(settings).length > 0;

  return {
    fieldId,
    widgetId,
    widgetNamespace,
    ...(hasSettings ? { settings: cloneDeep(settings) } : {})
  };
}

function makeDefaultControl(ct, field) {
  return {
    fieldId: field.apiName || field.id,
    field,
    widgetId: getDefaultWidgetId(field, ct.displayField),
    widgetNamespace: NAMESPACE_BUILTIN
  };
}
