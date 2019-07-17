import { identity, isObject, isEqual } from 'lodash';

import * as Random from 'utils/Random.es6';

import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces.es6';

export async function installOrUpdate(cma, checkAppStatus, { parameters }) {
  const { appId, extension, extensionDefinition } = await checkAppStatus();

  if (extension) {
    await cma.updateExtension({ ...extension, parameters });
  } else {
    await cma.createExtension({
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

function isCurrentExtension(widget, extensionId) {
  const isExtension = widget.widgetNamespace === NAMESPACE_EXTENSION;
  return isExtension && widget.widgetId === extensionId;
}

// Like `Promise.all` but rejecting input promises do not cause
// the result promise to reject. They are simply omitted.
async function promiseAllSafe(promises) {
  const guardedPromises = promises.map(p => p.then(identity, () => undefined));
  const results = await Promise.all(guardedPromises);

  return results.filter(identity);
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
