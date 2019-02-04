import { cloneDeep } from 'lodash';
import migrateControl from './ControlMigrations.es6';
import getDefaultWidgetId from './DefaultWidget.es6';

// Given a content type and its existing controls return
// synced controls as described in code comments.
export function syncControls(ct, controls) {
  // Controls are ordered as the content type fields are.
  return (ct.fields || []).map(field => {
    // Find an existing control for a field.
    const fieldId = field.apiName || field.id;
    const existingControl = (controls || []).find(c => c.fieldId === fieldId);

    // If found, use it. If not, create a default for the field type.
    const control = existingControl ? cloneDeep(existingControl) : makeDefaultControl(ct, field);

    // If the widget ID is not provided, use the default.
    if (typeof control.widgetId !== 'string') {
      control.widgetId = getDefaultWidgetId(field, ct.displayField);
    }

    // Attach the content type field to the control.
    control.field = cloneDeep(field);

    return control;
  });
}

// Given an API editor interface entity convert it to our
// internal representation as described in `syncControls`.
export function fromAPI(ct, ei) {
  return {
    sys: ei.sys,
    controls: syncControls(ct, ei.controls).map(c => migrateControl(c)),
    sidebar: ei.sidebar
  };
}

// Given an internal representation of an editor interface
// prepares it to be stored in the API.
export function toAPI(ct, ei) {
  return {
    sys: ei.sys,
    controls: syncControls(ct, ei.controls).map(c => prepareAPIControl(c)),
    sidebar: ei.sidebar
  };
}

// Given an internal representation of a control prepares
// a control to be stored in the API.
function prepareAPIControl({ fieldId, widgetId, settings }) {
  const settingsValid = typeof settings === 'object' && settings !== null;
  const hasSettings = settingsValid && Object.keys(settings).length > 0;

  return {
    fieldId,
    widgetId,
    ...(hasSettings ? { settings: cloneDeep(settings) } : {})
  };
}

function makeDefaultControl(ct, field) {
  return {
    fieldId: field.apiName || field.id,
    field,
    widgetId: getDefaultWidgetId(field, ct.displayField)
  };
}
