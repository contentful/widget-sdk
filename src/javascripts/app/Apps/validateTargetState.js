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
