import { get, isObject, set } from 'lodash';
import { Control, SidebarItem, WidgetNamespace, Editor } from 'features/widget-renderer';

export const getCurrentState = async (
  spaceContext: any,
  widgetId: string,
  widgetNamespace: WidgetNamespace
) => {
  const { items: editorInterfaces } = await spaceContext.cma.getEditorInterfaces();

  const CurrentState = { EditorInterface: {} };

  for (const editorInterface of editorInterfaces) {
    const contentTypeId = editorInterface.sys?.contentType?.sys?.id;

    if (!contentTypeId) {
      continue;
    }

    const controlsUsingApp = getControlsUsingApp({ widgetId, widgetNamespace }, editorInterface);
    const isIncludedInControls = controlsUsingApp.length > 0;

    const positionInSidebar = getPositionInSidebar({ widgetId, widgetNamespace }, editorInterface);
    const isIncludedInSidebar = positionInSidebar > -1;

    if (isIncludedInEditors({ widgetId, widgetNamespace }, editorInterface)) {
      set(CurrentState.EditorInterface, [contentTypeId, 'editor'], true);
    }

    if (isIncludedInControls) {
      const newControls = CurrentState.EditorInterface[contentTypeId]?.controls ?? [];
      set(
        CurrentState.EditorInterface,
        [contentTypeId, 'controls'],
        newControls.concat(controlsUsingApp.map((ei) => ({ fieldId: ei.fieldId })))
      );
    }

    if (isIncludedInSidebar) {
      set(CurrentState.EditorInterface, [contentTypeId, 'sidebar'], {
        position: positionInSidebar,
      });
    }
  }

  return CurrentState;
};

export const isUnsignedInteger = (n) => Number.isInteger(n) && n >= 0;

export function validateState(targetState) {
  const keys = Object.keys(targetState || {});

  // Right now only target state of Editor Interfaces can be expressed.
  const validKeys = keys.length === 0 || (keys.length === 1 && keys[0] === 'EditorInterface');
  if (!validKeys) {
    throw new Error('Invalid target state declared.');
  }

  const targetEditorInterfacesState = get(targetState, ['EditorInterface']) || {};
  const validTargetEditorInterfacesState = isObject(targetEditorInterfacesState);
  if (!validTargetEditorInterfacesState) {
    throw new Error('Invalid target state declared for EditorInterface entities.');
  }

  Object.keys(targetEditorInterfacesState).forEach((ctId) => {
    const ei = targetEditorInterfacesState[ctId];

    const validControls = !ei.controls || Array.isArray(ei.controls);
    if (!validControls) {
      throw new Error(`Invalid target controls declared for EditorInterface ${ctId}.`);
    }

    (ei.controls || []).forEach((control: Control) => {
      const validControl =
        isObject(control) && typeof control.fieldId === 'string' && control.fieldId.length > 0;
      if (!validControl) {
        throw new Error(`Invalid target controls declared for EditorInterface ${ctId}.`);
      }
    });

    const validSidebar = !ei.sidebar || ei.sidebar === true || isObject(ei.sidebar);
    if (!validSidebar) {
      throw new Error(`Invalid target sidebar declared for EditorInterface ${ctId}.`);
    }

    if (isObject(ei.sidebar)) {
      const validPosition = !ei.sidebar.position || isUnsignedInteger(ei.sidebar.position);
      if (!validPosition) {
        throw new Error(`Invalid target sidebar declared for EditorInterface ${ctId}.`);
      }
    }

    const validEditor = !ei.editor || ei.editor === true;
    if (!validEditor) {
      throw new Error(`Invalid target editor declared for EditorInterface ${ctId}`);
    }
  });
}

const isIncludedInEditors = (app, editorInterface): boolean => {
  if (editorInterface.editor) {
    return areSameApp(editorInterface.editor, app);
  } else if (editorInterface.editors) {
    return editorInterface.editors.some((editor) => areSameApp(editor, app));
  }

  return false;
};

const getControlsUsingApp = (app, editorInterface): Array<Control> => {
  if (editorInterface.controls) {
    return editorInterface.controls.filter((control) => areSameApp(control, app));
  }
  return [];
};

const getPositionInSidebar = (app, editorInterface) => {
  if (editorInterface.sidebar) {
    return editorInterface.sidebar.findIndex((sidebarItem) => areSameApp(sidebarItem, app));
  }
  return -1;
};

const areSameApp = (
  widgetOne: Editor | SidebarItem | Control,
  widgetTwo: Editor | SidebarItem | Control
): boolean => {
  return (
    widgetOne.widgetId === widgetTwo.widgetId &&
    widgetOne.widgetNamespace === WidgetNamespace.APP &&
    widgetTwo.widgetNamespace === WidgetNamespace.APP
  );
};
