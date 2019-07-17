import { pick, get, identity, isObject, isEqual } from 'lodash';

import * as Random from 'utils/Random.es6';
import * as SidebarDefaults from 'app/EntrySidebar/Configuration/defaults.es6';

import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';

// Like `Promise.all` but rejecting input promises do not cause
// the result promise to reject. They are simply omitted.
async function promiseAllSafe(promises) {
  const guardedPromises = promises.map(p => p.then(identity, () => undefined));
  const results = await Promise.all(guardedPromises);

  return results.filter(identity);
}

function getDefaultSidebar() {
  const defaultEntrySidebar = SidebarDefaults.EntryConfiguration;
  return defaultEntrySidebar.map(item => pick(item, ['widgetNamespace', 'widgetId']));
}

function isCurrentExtension(widget, extensionId) {
  const isExtension = widget.widgetNamespace === NAMESPACE_EXTENSION;
  return isExtension && widget.widgetId === extensionId;
}

export async function installOrUpdate(cma, checkAppStatus, { parameters, targetState }) {
  const { appId, extension, extensionDefinition } = await checkAppStatus();

  validateTargetState(targetState);

  let updatedExtension;

  if (extension) {
    updatedExtension = await cma.updateExtension({ ...extension, parameters });
  } else {
    updatedExtension = await cma.createExtension({
      sys: { id: `${appId}-app-${Random.id()}` },
      extensionDefinition: {
        sys: {
          type: 'Link',
          linkType: 'ExtensionDefinition',
          id: extensionDefinition.sys.id
        }
      },
      parameters
    });
  }

  const targetEditorInterfacesState = get(targetState, ['EditorInterface'], {});
  const extensionId = updatedExtension.sys.id;

  await updateEditorInterfaces(cma, targetEditorInterfacesState, extensionId);
}

function validateTargetState(targetState) {
  // Right now only target state of Editor Interfaces can be expressed.
  const targetEditorInterfacesState = get(targetState, ['EditorInterface'], {});

  if (!isObject(targetEditorInterfacesState)) {
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

    const validSidebar = !ei.sidebar || isObject(ei.sidebar);
    if (!validSidebar) {
      throw new Error(`Invalid target sidebar declared for EditorInterface ${ctId}.`);
    }

    if (isObject(ei.sidebar)) {
      const validPosition = !ei.sidebar.position || Number.isInteger(ei.sidebar.position);
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
async function updateEditorInterfaces(cma, targetEditorInterfacesState, extensionId) {
  const editorInterfaceIds = Object.keys(targetEditorInterfacesState);
  const editorInterfacePromises = editorInterfaceIds.map(id => cma.getEditorInterface(id));
  const editorInterfaces = await promiseAllSafe(editorInterfacePromises);

  const updatePromises = editorInterfaces
    .map(ei => {
      const targetState = targetEditorInterfacesState[ei.sys.contentType.sys.id];
      return updateEditorInterface(ei, targetState, extensionId);
    })
    .filter((ei, i) => !isEqual(ei, editorInterfaces[i]))
    .map(ei => cma.updateEditorInterface(ei));

  await promiseAllSafe(updatePromises);
}

function updateEditorInterface(ei, targetState, extensionId) {
  const result = { ...ei };

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
  }

  // Target state object for sidebar: `{ position?, settings? }`
  if (isObject(targetState.sidebar)) {
    // If there is no sidegar stored use the default one.
    const sidebar = Array.isArray(result.sidebar) ? result.sidebar : getDefaultSidebar();
    // Remove existing use of the current extension.
    result.sidebar = sidebar.filter(widget => !isCurrentExtension(widget, extensionId));

    const widget = {
      widgetNamespace: NAMESPACE_EXTENSION,
      widgetId: extensionId,
      settings: targetState.sidebar.settings
    };

    // If position is defined use it for insertion.
    if (Number.isInteger(targetState.sidebar.position)) {
      result.sidebar.splice(targetState.sidebar.position, 0, widget);
    } else {
      // Put it at the bottom if the position is not defined.
      result.sidebar.push(widget);
    }
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
  }

  return result;
}

// Best effort uninstallation.
export async function uninstall(cma, checkAppStatus) {
  const { extension } = await checkAppStatus();

  if (extension) {
    const extensionId = extension.sys.id;

    // Rewrite all EditorInterfaces refering the Extension.
    await removeEditorInterfaceReferences(cma, extensionId);

    // Remove the Extension itself.
    await cma.deleteExtension(extensionId);
  }
}

async function removeEditorInterfaceReferences(cma, extensionId) {
  const { items } = await cma.getContentTypes();
  const contentTypeIds = items.map(ct => ct.sys.id);

  const editorInterfacePromises = contentTypeIds.map(id => cma.getEditorInterface(id));
  const editorInterfaces = await promiseAllSafe(editorInterfacePromises);

  const updatePromises = editorInterfaces
    .map(ei => rewriteEditorInterface(ei, extensionId))
    .filter((ei, i) => !isEqual(ei, editorInterfaces[i]))
    .map(ei => cma.updateEditorInterface(ei));

  await promiseAllSafe(updatePromises);
}

function rewriteEditorInterface(ei, extensionId) {
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
