import { get } from 'lodash';

import {
  transformEditorInterfacesToTargetState,
  removeAllEditorInterfaceReferences,
} from './AppEditorInterfaces';
import { validateState } from './AppState';

export async function installOrUpdate(
  cma,
  evictWidget,
  checkAppStatus,
  { parameters, targetState } = {},
  spaceData
) {
  validateState(targetState);

  const { appDefinition, isMarketplaceInstallation } = await checkAppStatus();

  const appInstallation = await cma.updateAppInstallation(
    appDefinition.sys.id,
    parameters,
    isMarketplaceInstallation
  );

  await transformEditorInterfacesToTargetState(
    cma,
    get(targetState, ['EditorInterface'], {}),
    appInstallation,
    spaceData
  );

  await evictWidget(appInstallation);
}

// Best effort uninstallation.
export async function uninstall(cma, evictWidget, checkAppStatus) {
  const { appInstallation, appDefinition } = await checkAppStatus();

  if (appInstallation) {
    // Rewrite all EditorInterfaces refering the app widget.
    await removeAllEditorInterfaceReferences(cma, appInstallation);

    // Remove the AppInstallation itself.
    await cma.deleteAppInstallation(appDefinition.sys.id);
    await evictWidget(appInstallation);
  }
}
