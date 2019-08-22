import { get } from 'lodash';

import * as Random from 'utils/Random.es6';

import validateTargetState from './validateTargetState.es6';
import {
  transformEditorInterfacesToTargetState,
  removeAllEditorInterfaceReferences
} from './AppEditorInterfaces.es6';

function updateExtensionParameters(extension, parameters) {
  return { ...extension, parameters };
}

function makeNewAppExtension(appId, extensionDefinition, parameters) {
  return {
    sys: { id: `${appId}-app-${Random.id()}` },
    extensionDefinition: {
      sys: {
        type: 'Link',
        linkType: 'ExtensionDefinition',
        id: extensionDefinition.sys.id
      }
    },
    parameters
  };
}

export async function installOrUpdate(
  cma,
  extensionLoader,
  checkAppStatus,
  { parameters, targetState } = {}
) {
  validateTargetState(targetState);

  const extension = await createOrUpdateExtension(cma, checkAppStatus, parameters);

  extensionLoader.cacheExtension(extension);

  await transformEditorInterfacesToTargetState(
    cma,
    get(targetState, ['EditorInterface'], {}),
    extension.sys.id
  );
}

async function createOrUpdateExtension(cma, checkAppStatus, parameters) {
  const { appId, extension, extensionDefinition } = await checkAppStatus();

  return extension
    ? await cma.updateExtension(updateExtensionParameters(extension, parameters))
    : await cma.createExtension(makeNewAppExtension(appId, extensionDefinition, parameters));
}

// Best effort uninstallation.
export async function uninstall(cma, extensionLoader, checkAppStatus) {
  const { extension } = await checkAppStatus();

  if (extension) {
    const extensionId = extension.sys.id;

    // Rewrite all EditorInterfaces refering the Extension.
    await removeAllEditorInterfaceReferences(cma, extensionId);

    // Remove the Extension itself.
    await cma.deleteExtension(extensionId);
    extensionLoader.evictExtension(extensionId);
  }
}
