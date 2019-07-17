import { get } from 'lodash';

import * as Random from 'utils/Random.es6';

import validateTargetState from './validateTargetState.es6';
import {
  transformEditorInterfacesToTargetState,
  removeAllEditorInterfaceReferences
} from './AppEditorInterfaces.es6';

export async function installOrUpdate(cma, checkAppStatus, { parameters, targetState }) {
  validateTargetState(targetState);

  const extension = await createOrUpdateExtension(cma, checkAppStatus, parameters);

  await transformEditorInterfacesToTargetState(
    cma,
    get(targetState, ['EditorInterface'], {}),
    extension.sys.id
  );
}

async function createOrUpdateExtension(cma, checkAppStatus, parameters) {
  const { appId, extension, extensionDefinition } = await checkAppStatus();

  if (extension) {
    return cma.updateExtension({ ...extension, parameters });
  } else {
    return cma.createExtension({
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
    await removeAllEditorInterfaceReferences(cma, extensionId);

    // Remove the Extension itself.
    await cma.deleteExtension(extensionId);
  }
}
