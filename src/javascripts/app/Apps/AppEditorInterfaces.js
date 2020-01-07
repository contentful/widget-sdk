import { get, isObject, identity, pick, isEqual, cloneDeep } from 'lodash';

import * as SidebarDefaults from 'app/EntrySidebar/Configuration/defaults';
import * as Telemetry from 'i13n/Telemetry';

import { isUnsignedInteger } from './validateTargetState';

import { NAMESPACE_EXTENSION, NAMESPACE_APP } from 'widgets/WidgetNamespaces';

// Like `Promise.all` but rejecting input promises do not cause
// the result promise to reject. They are simply omitted.
async function promiseAllSafe(promises) {
  const guardedPromises = promises.map(p => {
    return p.then(identity, () => {
      Telemetry.count('apps.ignored-editor-interface-failure');
      return null;
    });
  });

  const results = await Promise.all(guardedPromises);

  return results.filter(identity);
}

export async function getDefaultSidebar() {
  const defaultEntrySidebar = await SidebarDefaults.getEntryConfiguration();
  return defaultEntrySidebar.map(item => pick(item, ['widgetNamespace', 'widgetId']));
}

function isCurrentApp(widget, appInstallation) {
  if (widget.widgetNamespace === NAMESPACE_EXTENSION) {
    // TODO: this check won't be needed when we migrate editor interfaces.
    return widget.widgetId === get(appInstallation, ['sys', 'widgetId']);
  } else if (widget.widgetNamespace === NAMESPACE_APP) {
    return widget.widgetId === get(appInstallation, ['sys', 'appDefinition', 'sys', 'id']);
  } else {
    return false;
  }
}

/**
 * Given a "target state" object it transforms EditorInterface entities
 * in an environment to match the target state provided.
 *
 * The input format is:
 * {
 *   'content-type-id-1': {
 *     controls: [
 *       { fieldId: 'title' },
 *       { fieldId: 'media', settings: { maxSize: 100 }}
 *     ],
 *     sidebar: { position: 2, settings: { externalId: 'test' } }
 *   },
 *   'some-other-ct-id': { editor: true }
 * }
 */
export async function transformEditorInterfacesToTargetState(cma, targetState, appInstallation) {
  const { items: editorInterfaces } = await cma.getEditorInterfaces();
  const defaultSidebar = await getDefaultSidebar();

  const updatePromises = editorInterfaces
    .map(ei => {
      return transformSingleEditorInterfaceToTargetState(
        ei,
        defaultSidebar,
        targetState[ei.sys.contentType.sys.id] || {},
        appInstallation
      );
    })
    .filter((ei, i) => !isEqual(ei, editorInterfaces[i]))
    .map(ei => cma.updateEditorInterface(ei));

  await promiseAllSafe(updatePromises);
}

function transformSingleEditorInterfaceToTargetState(
  ei,
  defaultSidebar,
  targetState,
  appInstallation
) {
  // Start by removing all references, only those declared in the target
  // state will be recreated.
  const result = removeSingleEditorInterfaceReferences(ei, appInstallation);

  const widgetId = get(appInstallation, ['sys', 'appDefinition', 'sys', 'id']);

  // Target state object for controls: `{ fieldId, settings? }`
  if (Array.isArray(targetState.controls)) {
    targetState.controls.forEach(control => {
      const idx = (result.controls || []).findIndex(cur => cur.fieldId === control.fieldId);
      result.controls[idx] = {
        fieldId: control.fieldId,
        widgetNamespace: NAMESPACE_APP,
        widgetId,
        settings: control.settings
      };
    });
  }

  // Target state object for sidebar: `{ position?, settings? }`.
  // It can also be `true` (it'll be put at the bottom of the sidebar with no settings).
  if (targetState.sidebar === true || isObject(targetState.sidebar)) {
    const targetSidebar = isObject(targetState.sidebar) ? targetState.sidebar : {};

    // If there is no sidebar stored use the default one.
    result.sidebar = Array.isArray(result.sidebar) ? result.sidebar : cloneDeep(defaultSidebar);

    const widget = { widgetNamespace: NAMESPACE_APP, widgetId };

    if (isObject(targetSidebar.settings)) {
      widget.settings = targetSidebar.settings;
    }

    // If position is defined use it for insertion.
    if (isUnsignedInteger(targetSidebar.position)) {
      result.sidebar.splice(targetSidebar.position, 0, widget);
    } else {
      // Put it at the bottom if the position is not defined.
      result.sidebar.push(widget);
    }
  }

  // If editor target state is set to `true` we just use the widget.
  if (targetState.editor === true) {
    result.editor = { widgetNamespace: NAMESPACE_APP, widgetId };
  } else if (isObject(targetState.editor)) {
    // Target state for editor may also be: `{ settings? }`
    result.editor = {
      widgetNamespace: NAMESPACE_APP,
      widgetId,
      settings: targetState.editor.settings
    };
  }

  return result;
}

export async function removeAllEditorInterfaceReferences(cma, appInstallation) {
  const { items: editorInterfaces } = await cma.getEditorInterfaces();

  const updatePromises = editorInterfaces
    .map(ei => removeSingleEditorInterfaceReferences(ei, appInstallation))
    .filter((ei, i) => !isEqual(ei, editorInterfaces[i]))
    .map(ei => cma.updateEditorInterface(ei));

  await promiseAllSafe(updatePromises);
}

function removeSingleEditorInterfaceReferences(ei, appInstallation) {
  ei = cloneDeep(ei);
  const result = { sys: ei.sys };

  if (Array.isArray(ei.controls)) {
    // If the app is used in `controls`, reset it to the default.
    result.controls = ei.controls.map(control => {
      return isCurrentApp(control, appInstallation) ? { fieldId: control.fieldId } : control;
    });
  }

  if (Array.isArray(ei.sidebar)) {
    // If the app is used in `sidebar`, remove it from the list.
    result.sidebar = ei.sidebar.filter(widget => !isCurrentApp(widget, appInstallation));
  }

  // If the app is used as `editor`, unset the reference.
  if (isObject(ei.editor) && !isCurrentApp(ei.editor, appInstallation)) {
    result.editor = ei.editor;
  }

  return result;
}
