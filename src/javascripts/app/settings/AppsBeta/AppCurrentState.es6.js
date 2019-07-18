import { isObject } from 'lodash';

import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';

export default async function getCurrentAppState(cma, extensionId) {
  const { items } = await cma.getContentTypes();
  const contentTypeIds = items.map(ct => ct.sys.id);

  const editorInterfaces = await Promise.all(contentTypeIds.map(id => cma.getEditorInterface(id)));

  const editorInterfacesState = editorInterfaces
    .map(ei => {
      return [ei.sys.contentType.sys.id, getSingleEditorInterfaceState(ei, extensionId)];
    })
    .filter(([_, state]) => Object.keys(state).length > 0)
    .reduce((acc, [ctId, state]) => ({ ...acc, [ctId]: state }), {});

  return {
    EditorInterface: editorInterfacesState
  };
}

function getSingleEditorInterfaceState(ei, extensionId) {
  const result = {};

  if (Array.isArray(ei.controls)) {
    const extensionControls = ei.controls.filter(control => {
      return control.widgetNamespace === NAMESPACE_EXTENSION && control.widgetId === extensionId;
    });

    if (extensionControls.length > 0) {
      result.controls = extensionControls.map(control => {
        const mapped = { fieldId: control.fieldId };
        if (control.settings) {
          mapped.settings = control.settings;
        }
        return mapped;
      });
    }
  }

  if (Array.isArray(ei.sidebar)) {
    const idx = ei.sidebar.findIndex(widget => {
      return widget.widgetNamespace === NAMESPACE_EXTENSION && widget.widgetId === extensionId;
    });

    if (idx > -1) {
      result.sidebar = { position: idx };
      const { settings } = ei.sidebar[idx];
      if (settings) {
        result.sidebar.settings = settings;
      }
    }
  }

  const { editor } = ei;
  if (isObject(editor)) {
    if (editor.widgetNamespace === NAMESPACE_EXTENSION && editor.widgetId === extensionId) {
      result.editor = editor.settings ? { settings: editor.settings } : true;
    }
  }

  return result;
}
