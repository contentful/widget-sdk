import { get, isObject } from 'lodash';

import { NAMESPACE_APP } from 'widgets/WidgetNamespaces';

export default async function getCurrentAppState(cma, appInstallation) {
  const { items: editorInterfaces } = await cma.getEditorInterfaces();

  const widgetId = get(appInstallation, ['sys', 'appDefinition', 'sys', 'id']);
  const isCurrentApp = w => w.widgetNamespace === NAMESPACE_APP && w.widgetId === widgetId;

  const editorInterfacesState = editorInterfaces
    .map(ei => {
      return [ei.sys.contentType.sys.id, getSingleEditorInterfaceState(ei, isCurrentApp)];
    })
    .filter(([_, state]) => Object.keys(state).length > 0)
    .reduce((acc, [ctId, state]) => ({ ...acc, [ctId]: state }), {});

  return {
    EditorInterface: editorInterfacesState
  };
}

function getSingleEditorInterfaceState(ei, isCurrentApp) {
  const result = {};

  if (Array.isArray(ei.controls)) {
    const appControls = ei.controls.filter(isCurrentApp);
    if (appControls.length > 0) {
      result.controls = appControls.map(control => {
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
