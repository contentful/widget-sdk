import { get, isObject } from 'lodash';

import { NAMESPACE_EXTENSION, NAMESPACE_APP } from 'widgets/WidgetNamespaces';

export default async function getCurrentAppState(cma, appInstallation) {
  const { items: editorInterfaces } = await cma.getEditorInterfaces();

  const editorInterfacesState = editorInterfaces
    .map(ei => {
      return [ei.sys.contentType.sys.id, getSingleEditorInterfaceState(ei, appInstallation)];
    })
    .filter(([_, state]) => Object.keys(state).length > 0)
    .reduce((acc, [ctId, state]) => ({ ...acc, [ctId]: state }), {});

  return {
    EditorInterface: editorInterfacesState
  };
}

function getSingleEditorInterfaceState(ei, appInstallation) {
  const result = {};

  const isCurrentApp = widget => {
    if (widget.widgetNamespace === NAMESPACE_EXTENSION) {
      // TODO: this check won't be needed when we migrate editor interfaces.
      return widget.widgetId === get(appInstallation, ['sys', 'widgetId']);
    } else if (widget.widgetNamespace === NAMESPACE_APP) {
      return widget.widgetId === get(appInstallation, ['sys', 'appDefinition', 'sys', 'id']);
    } else {
      return false;
    }
  };

  if (Array.isArray(ei.controls)) {
    const extensionControls = ei.controls.filter(isCurrentApp);
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
    const idx = ei.sidebar.findIndex(isCurrentApp);
    if (idx > -1) {
      result.sidebar = { position: idx };
      const { settings } = ei.sidebar[idx];
      if (settings) {
        result.sidebar.settings = settings;
      }
    }
  }

  const { editor } = ei;
  if (isObject(editor) && isCurrentApp(editor)) {
    result.editor = editor.settings ? { settings: editor.settings } : true;
  }

  return result;
}
