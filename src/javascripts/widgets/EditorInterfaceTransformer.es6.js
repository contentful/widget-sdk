import { cloneDeep } from 'lodash';
import migrateControl from './ControlMigrations.es6';
import getDefaultWidgetId from './DefaultWidget.es6';

// Given a content type, its existing controls and space widgets
// return  synced controls as described in code comments.
export function syncControls(ct, controls, widgets) {
  // Controls are ordered as the content type fields are.
  return (ct.fields || []).map(field => {
    // Find an existing control for a field.
    const fieldId = field.apiName || field.id;
    const existingControl = (controls || []).find(c => c.fieldId === fieldId);

    // If found, use it. If not, create a default for the field type.
    const control = existingControl ? cloneDeep(existingControl) : makeDefaultControl(ct, field);

    // If the widget ID is not provided, use the default.
    if (typeof control.widgetId !== 'string') {
      control.widgetNamespace = 'builtin';
      control.widgetId = getDefaultWidgetId(field, ct.displayField);
    }

    // If the widget namespace is not given, determine it.
    if (typeof control.widgetNamespace !== 'string') {
      control.widgetNamespace = determineWidgetNamespace(control, widgets);
    }

    // Attach the content type field to the control.
    control.field = cloneDeep(field);

    // Migrate control if needed.
    control.widgetId = migrateControl(control);

    return control;
  });
}

// Historically if there is an extension with ID the same as a builtin
// editor ID the extension takes precedence. The code below checks
// the extension namespace first and then falls back to builtin widgets.
function determineWidgetNamespace({ widgetId }, widgets = {}) {
  const extensionWidget = (widgets.extension || []).find(w => w.id === widgetId);

  return extensionWidget ? 'extension' : 'builtin';
}

// Given an API editor interface entity convert it to our
// internal representation as described in `syncControls`.
export function fromAPI(ct, ei, widgets) {
  return {
    sys: ei.sys,
    controls: syncControls(ct, ei.controls, widgets),
    sidebar: ei.sidebar
  };
}

// Given an internal representation of an editor interface
// prepares it to be stored in the API.
export function toAPI(ct, ei, widgets) {
  return {
    sys: ei.sys,
    controls: syncControls(ct, ei.controls, widgets).map(c => prepareAPIControl(c)),
    sidebar: ei.sidebar
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
    widgetNamespace: 'builtin'
  };
}
