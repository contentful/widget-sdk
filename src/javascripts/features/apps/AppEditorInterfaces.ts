import { get, isObject, identity, pick, isEqual, cloneDeep } from 'lodash';

import * as SidebarDefaults from 'app/EntrySidebar/Configuration/defaults';
import * as EntryEditorDefaults from 'app/entry_editor/DefaultConfiguration';

import { WidgetNamespace } from 'features/widget-renderer';
import { isUnsignedInteger } from './AppState';
import { EditorInterface } from 'contentful-ui-extensions-sdk';

// Like `Promise.all` but rejecting input promises do not cause
// the result promise to reject. They are simply omitted.
async function promiseAllSafe(promises) {
  const guardedPromises = promises.map((p) => {
    return p.then(identity, () => null);
  });

  const results = await Promise.all(guardedPromises);

  return results.filter(identity);
}

export async function getDefaultSidebar() {
  const defaultEntrySidebar = await SidebarDefaults.getEntryConfiguration();
  return defaultEntrySidebar.map((item) => pick(item, ['widgetNamespace', 'widgetId']));
}

export async function getDefaultEditors() {
  const defaultEntryEditors = await EntryEditorDefaults.getEntryConfiguration();
  return defaultEntryEditors.map((item) => pick(item, ['widgetNamespace', 'widgetId']));
}

function isCurrentApp(widget, appInstallation) {
  const widgetId = get(appInstallation, ['sys', 'appDefinition', 'sys', 'id']);

  return widget.widgetNamespace === WidgetNamespace.APP && widget.widgetId === widgetId;
}

/**
 * Given a "target state" object it transforms EditorInterface entities
 * in an environment to match the target state provided.
 *
 * The input format is:
 * {
 *   'content-type-id-1': {
 *     controls: [{ fieldId: 'title' }, { fieldId: 'media' }],
 *     sidebar: { position: 2 }
 *   },
 *   'some-other-ct-id': { editor: true }
 * }
 */
export async function transformEditorInterfacesToTargetState(cma, targetState, appInstallation) {
  const { items: editorInterfaces } = await cma.getEditorInterfaces();
  const defaultSidebar = await getDefaultSidebar();
  const defaultEditors = await getDefaultEditors();

  const updatePromises = editorInterfaces
    .map((ei) => {
      return transformSingleEditorInterfaceToTargetState(
        ei,
        defaultSidebar,
        defaultEditors,
        targetState[ei.sys.contentType.sys.id] || {},
        appInstallation
      );
    })
    .filter((ei, i) => !isEqual(ei, editorInterfaces[i]))
    .map((ei) => cma.updateEditorInterface(ei));

  await promiseAllSafe(updatePromises);
}

type EditorInterfaceConfiguration = { widgetNamespace: string | WidgetNamespace; widgetId: string };

/**
 * Elements in targetState can come in either as boolean or with a position.
 * The expected behavior is:
 *  - `true` -> element is pushed at the end of the list
 *  - position: n -> element is positioned at the nth position in current list
 *
 * If current list is missing or has a wrong shape, it gets replaced by the default list
 */
function handlePositionalEditorInterface(
  targetStateItem: boolean | { position?: number },
  currentItem: EditorInterfaceConfiguration[],
  defaultItem: EditorInterfaceConfiguration[],
  widgetId: string
): EditorInterfaceConfiguration[] {
  // If there is no item stored use the default one.
  const result = Array.isArray(currentItem) ? currentItem : cloneDeep(defaultItem);

  const widget = { widgetNamespace: WidgetNamespace.APP, widgetId };

  if (targetStateItem === true) {
    return [...result, widget];
  }

  if (isObject(targetStateItem)) {
    // If position is defined use it for insertion.
    if (isUnsignedInteger(targetStateItem.position)) {
      result.splice(targetStateItem.position, 0, widget);
      return result;
    } else {
      // Put it at the bottom if the position is not defined.
      return [...result, widget];
    }
  }

  return result;
}

function transformSingleEditorInterfaceToTargetState(
  ei,
  defaultSidebar,
  defaultEditors,
  targetState,
  appInstallation
): EditorInterface {
  // Start by removing all references, only those declared in the target
  // state will be recreated.
  const editorInterface = removeSingleEditorInterfaceReferences(ei, appInstallation);
  const result: EditorInterface = { sys: editorInterface.sys };

  const widgetId = get(appInstallation, ['sys', 'appDefinition', 'sys', 'id']);

  // Target state object for controls: `{ fieldId }`
  if (Array.isArray(targetState.controls)) {
    const controls = editorInterface.controls ?? [];

    targetState.controls.forEach((control) => {
      const idx = controls.findIndex((cur) => cur.fieldId === control.fieldId);
      controls[idx] = {
        fieldId: control.fieldId,
        widgetNamespace: WidgetNamespace.APP,
        widgetId,
      };
    });

    result.controls = controls;
  }

  if (targetState.sidebar) {
    const existingSidebar = editorInterface.sidebar as EditorInterfaceConfiguration[];

    result.sidebar = handlePositionalEditorInterface(
      targetState.sidebar,
      existingSidebar,
      defaultSidebar,
      widgetId
    );
  }

  // When we get `editor` (singular) with boolean value, fallback
  // to legacy behavior: widget replaces default editor and there
  // is no list of editors
  if (targetState.editor === true) {
    result.editor = { widgetNamespace: WidgetNamespace.APP, widgetId };
  }
  // As opposed to when we get `editors` (plural), in which case we behave like sidebars
  else if (targetState.editors) {
    const existingEditors = editorInterface.editors as EditorInterfaceConfiguration[];

    const editors = handlePositionalEditorInterface(
      targetState.editors,
      existingEditors,
      defaultEditors,
      widgetId
    );

    // Do not send empty list of editors to always have at least the default
    if (editors && editors.length) {
      result.editors = editors;
    }
  }

  return result;
}

export async function removeAllEditorInterfaceReferences(cma, appInstallation) {
  const { items: editorInterfaces } = await cma.getEditorInterfaces();

  const updatePromises = editorInterfaces
    .map((ei) => removeSingleEditorInterfaceReferences(ei, appInstallation))
    .filter((ei, i) => !isEqual(ei, editorInterfaces[i]))
    .map((ei) => cma.updateEditorInterface(ei));

  await promiseAllSafe(updatePromises);
}

function removeSingleEditorInterfaceReferences(ei, appInstallation): EditorInterface {
  ei = cloneDeep(ei);
  const result: EditorInterface = { sys: ei.sys };

  if (Array.isArray(ei.controls)) {
    // If the app is used in `controls`, reset it to the default.
    result.controls = ei.controls.map((control) => {
      return isCurrentApp(control, appInstallation) ? { fieldId: control.fieldId } : control;
    });
  }

  if (Array.isArray(ei.sidebar)) {
    // If the app is used in `sidebar`, remove it from the list.
    result.sidebar = ei.sidebar.filter((widget) => !isCurrentApp(widget, appInstallation));
  }

  if (Array.isArray(ei.editors)) {
    // If the app is used as `editor`, remove it from the list.
    const otherEditors = ei.editors.filter((widget) => !isCurrentApp(widget, appInstallation));

    // As opposed to sidebars, we always want to have at least the default editor.
    // Empty editors list are hence discarded
    if (otherEditors.length > 0) {
      result.editors = otherEditors;
    }
  }

  if (isObject(ei.editor) && !isCurrentApp(ei.editor, appInstallation)) {
    result.editor = ei.editor;
  }

  return result;
}
