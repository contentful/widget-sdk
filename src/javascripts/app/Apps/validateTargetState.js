import { get, isObject } from 'lodash';

export const isUnsignedInteger = n => Number.isInteger(n) && n >= 0;

export default function validateTargetState(targetState) {
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

  Object.keys(targetEditorInterfacesState).forEach(ctId => {
    const ei = targetEditorInterfacesState[ctId];

    const validControls = !ei.controls || Array.isArray(ei.controls);
    if (!validControls) {
      throw new Error(`Invalid target controls declared for EditorInterface ${ctId}.`);
    }

    (ei.controls || []).forEach(control => {
      const validControl = typeof control.fieldId === 'string' && isObject(control.settings || {});
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
      const validSettings = isObject(ei.sidebar.settings || {});
      if (!(validPosition && validSettings)) {
        throw new Error(`Invalid target sidebar declared for EditorInterface ${ctId}.`);
      }
    }

    const validEditor = !ei.editor || ei.editor === true || isObject(ei.editor);
    if (!validEditor) {
      throw new Error(`Invalid target editor declared for EditorInterface ${ctId}`);
    }

    if (isObject(ei.editor)) {
      const validSettings = isObject(ei.editor.settings || {});
      if (!validSettings) {
        throw new Error(`Invalid target editor declared for EditorInterface ${ctId}.`);
      }
    }
  });
}
