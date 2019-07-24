import { isObject, identity, pick, isEqual, cloneDeep } from 'lodash';

import * as SidebarDefaults from 'app/EntrySidebar/Configuration/defaults.es6';
import * as Telemetry from 'i13n/Telemetry.es6';

import { isUnsignedInteger } from './validateTargetState.es6';

import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';

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

function isCurrentExtension(widget, extensionId) {
  const isExtension = widget.widgetNamespace === NAMESPACE_EXTENSION;
  return isExtension && widget.widgetId === extensionId;
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
export async function transformEditorInterfacesToTargetState(cma, targetState, extensionId) {
  const editorInterfaceIds = Object.keys(targetState);
  const editorInterfacePromises = editorInterfaceIds.map(id => cma.getEditorInterface(id));
  const [editorInterfaces, defaultSidebar] = await Promise.all([
    promiseAllSafe(editorInterfacePromises),
    getDefaultSidebar()
  ]);

  const updatePromises = editorInterfaces
    .map(ei => {
      return transformSingleEditorInterfaceToTargetState(
        ei,
        defaultSidebar,
        targetState[ei.sys.contentType.sys.id] || {},
        extensionId
      );
    })
    .filter((ei, i) => !isEqual(ei, editorInterfaces[i]))
    .map(ei => cma.updateEditorInterface(ei));

  await promiseAllSafe(updatePromises);
}

function transformSingleEditorInterfaceToTargetState(ei, defaultSidebar, targetState, extensionId) {
  const result = cloneDeep(ei);

  // If there is no target state for a property, we use a version
  // without references instead.
  const removeRefsResult = removeSingleEditorInterfaceReferences(ei, extensionId);

  // Target state object for controls: `{ fieldId, settings? }`
  if (Array.isArray(targetState.controls)) {
    targetState.controls.forEach(control => {
      const idx = (result.controls || []).findIndex(cur => cur.fieldId === control.fieldId);
      result.controls[idx] = {
        fieldId: control.fieldId,
        widgetNamespace: NAMESPACE_EXTENSION,
        widgetId: extensionId,
        settings: control.settings
      };
    });
  } else if (ei.controls) {
    result.controls = removeRefsResult.controls;
  }

  // Target state object for sidebar: `{ position?, settings? }`.
  // It can also be `true` (it'll be put at the bottom of the sidebar with no settings).
  if (targetState.sidebar === true || isObject(targetState.sidebar)) {
    // If there is no sidebar stored use the default one.
    const sidebar = Array.isArray(result.sidebar) ? result.sidebar : defaultSidebar;
    // Remove existing use of the current extension.
    result.sidebar = sidebar.filter(widget => !isCurrentExtension(widget, extensionId));

    const targetSidebar = isObject(targetState.sidebar) ? targetState.sidebar : {};

    const widget = {
      widgetNamespace: NAMESPACE_EXTENSION,
      widgetId: extensionId
    };

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
  } else if (ei.sidebar) {
    result.sidebar = removeRefsResult.sidebar;
  }

  // If editor target state is set to `true` we just use the Extension.
  if (targetState.editor === true) {
    result.editor = {
      widgetNamespace: NAMESPACE_EXTENSION,
      widgetId: extensionId
    };
  } else if (isObject(targetState.editor)) {
    // Target state for editor may also be: `{ settings? }`
    result.editor = {
      widgetNamespace: NAMESPACE_EXTENSION,
      widgetId: extensionId,
      settings: targetState.editor.settings
    };
  } else if (ei.editor) {
    result.editor = removeRefsResult.editor;
  }

  return result;
}

export async function removeAllEditorInterfaceReferences(cma, extensionId) {
  const { items } = await cma.getContentTypes();
  const contentTypeIds = items.map(ct => ct.sys.id);

  const editorInterfacePromises = contentTypeIds.map(id => cma.getEditorInterface(id));
  const editorInterfaces = await promiseAllSafe(editorInterfacePromises);

  const updatePromises = editorInterfaces
    .map(ei => removeSingleEditorInterfaceReferences(ei, extensionId))
    .filter((ei, i) => !isEqual(ei, editorInterfaces[i]))
    .map(ei => cma.updateEditorInterface(ei));

  await promiseAllSafe(updatePromises);
}

function removeSingleEditorInterfaceReferences(ei, extensionId) {
  ei = cloneDeep(ei);
  const result = { sys: ei.sys };

  if (Array.isArray(ei.controls)) {
    // If extension is used in `controls`, reset it to the default.
    result.controls = ei.controls.map(control => {
      return isCurrentExtension(control, extensionId) ? { fieldId: control.fieldId } : control;
    });
  }

  if (Array.isArray(ei.sidebar)) {
    // If extension is used in `sidebar`, remove it from the list.
    result.sidebar = ei.sidebar.filter(widget => !isCurrentExtension(widget, extensionId));
  }

  // If extension is used as `editor`, unset the reference.
  if (isObject(ei.editor) && !isCurrentExtension(ei.editor, extensionId)) {
    result.editor = ei.editor;
  }

  return result;
}
