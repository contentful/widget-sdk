import { get } from 'lodash';

import validateTargetState from './validateTargetState';
import {
  transformEditorInterfacesToTargetState,
  removeAllEditorInterfaceReferences
} from './AppEditorInterfaces';

export async function installOrUpdate(
  cma,
  evictWidget,
  checkAppStatus,
  { parameters, targetState } = {}
) {
  validateTargetState(targetState);

  const { appDefinition, isMarketplaceInstallation } = await checkAppStatus();

  const appInstallation = await cma.updateAppInstallation(
    appDefinition.sys.id,
    parameters,
    isMarketplaceInstallation
  );

  await transformEditorInterfacesToTargetState(
    cma,
    get(targetState, ['EditorInterface'], {}),
    appInstallation
  );

  evictWidget(appInstallation);
}

// Best effort uninstallation.
export async function uninstall(cma, evictWidget, checkAppStatus) {
  const { appInstallation, appDefinition } = await checkAppStatus();

  if (appInstallation) {
    // Rewrite all EditorInterfaces refering the app widget.
    await removeAllEditorInterfaceReferences(cma, appInstallation);

    // Remove the AppInstallation itself.
    await cma.deleteAppInstallation(appDefinition.sys.id);
    evictWidget(appInstallation);
  }
}
