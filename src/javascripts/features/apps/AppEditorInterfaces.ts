import { get, isObject, identity, pick, isEqual, cloneDeep, isEmpty } from 'lodash';

import * as SidebarDefaults from 'app/EntrySidebar/Configuration/defaults';
import * as EntryEditorDefaults from 'app/entry_editor/DefaultConfiguration';

import { WidgetNamespace } from '@contentful/widget-renderer';
import { isUnsignedInteger, PartialTargetState } from './AppState';
import APIClient from 'data/APIClient';
import {
  AppInstallationProps,
  ContentTypeProps,
  EditorInterfaceProps,
} from 'contentful-management/types';

// Like `Promise.all` but rejecting input promises do not cause
// the result promise to reject. They are simply omitted.
async function promiseAllSafe(promises) {
  const guardedPromises = promises.map((p) => {
    return p.then(identity, () => null);
  });

  const results = await Promise.all(guardedPromises);

  return results.filter(identity);
}

export async function getDefaultSidebar(
  spaceData
): Promise<{ widgetId: string; widgetNamespace: WidgetNamespace }[]> {
  const defaultEntrySidebar = await SidebarDefaults.getEntryConfiguration({
    spaceId: spaceData.spaceId,
  });
  return defaultEntrySidebar.map((item) => pick(item, ['widgetNamespace', 'widgetId']));
}

export async function getDefaultEditors(
  spaceData
): Promise<{ widgetId: string; widgetNamespace: WidgetNamespace }[]> {
  const defaultEntryEditors = await EntryEditorDefaults.getEntryConfiguration(spaceData);
  return defaultEntryEditors.map((item) => pick(item, ['widgetNamespace', 'widgetId']));
}

function isCurrentApp(widget: any, appInstallation: AppInstallationProps): boolean {
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
 *     controls: [{ fieldId: 'title', settings: {} }, { fieldId: 'media', settings: {} }],
 *     sidebar: { position: 2, settings: {} }
 *   },
 *   'some-other-ct-id': { editor: true, settings: {} }
 * }
 */
export async function transformEditorInterfacesToTargetState(
  cma: APIClient,
  targetState: Record<string, Record<string, PartialTargetState>>,
  appInstallation: AppInstallationProps,
  spaceData
) {
  const [{ items: editorInterfaces }, defaultSidebar, defaultEditors] = await Promise.all([
    cma.getEditorInterfaces(),
    getDefaultSidebar(spaceData),
    getDefaultEditors(spaceData),
  ]);

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

/**
 * Elements in targetState can come in either as boolean or with a position.
 * The expected behavior is:
 *  - `true` -> element is pushed at the end of the list
 *  - position: n -> element is positioned at the nth position in current list
 *
 * If current list is missing or has a wrong shape, it gets replaced by the default list
 */
function transformWidgetList(
  partialTargetState: PartialTargetState,
  defaultWidgets: any[],
  widgetId: string,
  existingWidgets?: any[]
): any[] {
  // If there is no item stored use the default one.
  const result = Array.isArray(existingWidgets) ? existingWidgets : cloneDeep(defaultWidgets);

  const widget: {
    widgetNamespace: WidgetNamespace;
    widgetId: string;
    settings?: Record<string, boolean | string | number>;
  } = {
    widgetNamespace: WidgetNamespace.APP,
    widgetId,
  };

  if (partialTargetState === true) {
    return [...result, widget];
  }

  if (isObject(partialTargetState)) {
    // Include settings only if they exist
    if (partialTargetState.settings) {
      widget.settings = partialTargetState.settings;
    }

    // If position is defined use it for insertion.
    if (isUnsignedInteger(partialTargetState.position)) {
      result.splice(partialTargetState.position, 0, widget);
      return result;
    } else {
      // Put it at the bottom if the position is not defined.
      return [...result, widget];
    }
  }

  return result;
}

function transformSingleEditorInterfaceToTargetState(
  ei: EditorInterfaceProps,
  defaultSidebar: { widgetId: string; widgetNamespace: WidgetNamespace }[],
  defaultEditors: { widgetId: string; widgetNamespace: WidgetNamespace }[],
  targetState: Record<ContentTypeProps['sys']['id'], PartialTargetState>,
  appInstallation: AppInstallationProps
): EditorInterfaceProps {
  // Start by removing all references, only those declared in the target
  // state will be recreated.
  const result = removeSingleEditorInterfaceReferences(ei, appInstallation);

  const widgetId = get(appInstallation, ['sys', 'appDefinition', 'sys', 'id']);

  // Target state object for controls: `{ fieldId }`
  if (Array.isArray(targetState.controls)) {
    targetState.controls.forEach((control) => {
      const controls = Array.isArray(result.controls) ? [...result.controls] : [];
      const idx = controls.findIndex((cur) => cur.fieldId === control.fieldId);

      const item: {
        fieldId: string;
        widgetNamespace: WidgetNamespace;
        widgetId: string;
        settings?: Record<string, boolean | string | number>;
      } = {
        fieldId: control.fieldId,
        widgetNamespace: WidgetNamespace.APP,
        widgetId,
      };

      // Include settings only if they exist
      if (control.settings) {
        item.settings = control.settings;
      }

      // Usually controls will be defined and field will be found by ID.
      if (idx > -1) {
        controls[idx] = item;
      } else {
        // But if not, we still need to populate the item.
        controls.push(item);
      }

      result.controls = controls;
    });
  }

  if (targetState.sidebar) {
    result.sidebar = transformWidgetList(
      targetState.sidebar,
      defaultSidebar,
      widgetId,
      result.sidebar
    );
  }

  // When we get `editor` (singular) with boolean value, fallback
  // to legacy behavior: widget replaces default editor and there
  // is no list of editors
  if (targetState.editor === true) {
    result.editor = { widgetNamespace: WidgetNamespace.APP, widgetId };
    delete result.editors;
  }
  // As opposed to when we get `editors` (plural), in which case we behave like sidebars
  else if (targetState.editors) {
    result.editors = transformWidgetList(
      targetState.editors,
      defaultEditors,
      widgetId,
      result.editors
    );
    delete result.editor;
  }

  return result;
}

export async function removeAllEditorInterfaceReferences(
  cma: APIClient,
  appInstallation: AppInstallationProps
) {
  const { items: editorInterfaces } = await cma.getEditorInterfaces();

  const updatePromises = editorInterfaces
    .map((ei) => removeSingleEditorInterfaceReferences(ei, appInstallation))
    // We always want at least the default editor, hence we remove
    // empty list to fallback to default editors
    .map(({ editors, ...ei }) => (isEmpty(editors) ? ei : { ...ei, editors }))
    .filter((ei, i) => !isEqual(ei, editorInterfaces[i]))
    .map((ei) => cma.updateEditorInterface(ei));

  await promiseAllSafe(updatePromises);
}

function removeSingleEditorInterfaceReferences(
  ei: EditorInterfaceProps,
  appInstallation: AppInstallationProps
): EditorInterfaceProps {
  ei = cloneDeep(ei);
  const result: EditorInterfaceProps = { sys: ei.sys };

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
    result.editors = ei.editors.filter((widget) => !isCurrentApp(widget, appInstallation));
  }

  if (isObject(ei.editor) && !isCurrentApp(ei.editor, appInstallation)) {
    result.editor = ei.editor;
  }

  return result;
}
