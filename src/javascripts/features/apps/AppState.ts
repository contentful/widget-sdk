import { get, isObject, set, isPlainObject as _isPlainObject, isUndefined } from 'lodash';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { AppState } from '@contentful/app-sdk';
import { Control, Editor, SidebarItem } from 'contentful-management/types';
import APIClient from 'data/APIClient';

export type PartialTargetState =
  | boolean
  | { position: number; settings?: Record<string, string | number | boolean> };

export const getCurrentState = async (
  cma: APIClient,
  widgetId: string,
  widgetNamespace: WidgetNamespace
): Promise<AppState> => {
  const { items: editorInterfaces } = await cma.getEditorInterfaces();

  const CurrentState = { EditorInterface: {} };

  for (const editorInterface of editorInterfaces) {
    console.log({ editorInterface });

    const contentTypeId = editorInterface.sys?.contentType?.sys?.id;
    if (!contentTypeId) {
      continue;
    }
    const controlsUsingApp = getControlsUsingApp({ widgetId, widgetNamespace }, editorInterface);

    const isIncludedInControls = controlsUsingApp.length > 0;
    const positionInSidebar = getPositionInSidebar({ widgetId, widgetNamespace }, editorInterface);
    const isIncludedInSidebar = positionInSidebar > -1;

    // If editor is singular, return the legacy boolean value
    if (editorInterface.editor) {
      set(
        CurrentState.EditorInterface,
        [contentTypeId, 'editor'],
        areSameApp(editorInterface.editor, {
          widgetId,
          widgetNamespace,
        })
      );
      // if editors is a list, identify the position
    } else if (editorInterface.editors) {
      const positionInEditors = getPositionInEditors(
        { widgetId, widgetNamespace },
        editorInterface
      );

      if (positionInEditors > -1) {
        set(CurrentState.EditorInterface, [contentTypeId, 'editors'], {
          position: positionInEditors,
        });
      }
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

export const isUnsignedInteger = (n): n is number => Number.isInteger(n) && n >= 0;

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
        isObject(control) &&
        Object.keys(control).every((key) => ['fieldId', 'settings'].includes(key)) &&
        typeof control.fieldId === 'string' &&
        control.fieldId.length > 0 &&
        isValidSettingsObject(control.settings);
      if (!validControl) {
        throw new Error(`Invalid target controls declared for EditorInterface ${ctId}.`);
      }
    });

    validatePositionalPartialTargetState(ei.sidebar, ctId, 'sidebar');

    validatePositionalPartialTargetState(ei.editors, ctId, 'editors');

    const validEditor = !ei.editor || ei.editor === true;
    if (!validEditor) {
      throw new Error(`Invalid target editor declared for EditorInterface ${ctId}`);
    }
  });
}

const validatePositionalPartialTargetState = (
  partialTargetState: PartialTargetState,
  ctId: string,
  name: string
) => {
  const isValidPartialTargetState =
    !partialTargetState || partialTargetState === true || isObject(partialTargetState);
  if (!isValidPartialTargetState) {
    throw new Error(`Invalid target ${name} declared for EditorInterface ${ctId}.`);
  }

  if (isObject(partialTargetState)) {
    const validPosition =
      !partialTargetState.position || isUnsignedInteger(partialTargetState.position);
    const hasAdditionalKeys = Object.keys(partialTargetState).some(
      (key) => !['position', 'settings'].includes(key)
    );
    if (
      !validPosition ||
      !isValidSettingsObject(partialTargetState.settings) ||
      hasAdditionalKeys
    ) {
      throw new Error(`Invalid target ${name} declared for EditorInterface ${ctId}.`);
    }
  }
};

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

const getPositionInEditors = (app, editorInterface) => {
  if (editorInterface.editors) {
    return editorInterface.editors.findIndex((editor) => areSameApp(editor, app));
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

const isPlainObject = (value: any): value is object => _isPlainObject(value);

const isValidSettingsObject = (settings: unknown) => {
  if (isUndefined(settings)) {
    return true;
  }

  if (!isPlainObject(settings)) {
    return false;
  }

  const isValidProperty = (property: any) => property && !isObject(property);

  return Object.values(settings).every(isValidProperty);
};
