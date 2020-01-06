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

  const { appDefinition } = await checkAppStatus();
  const appInstallation = await cma.updateAppInstallation(appDefinition.sys.id, parameters);
  const { widgetId } = appInstallation.sys;

  await transformEditorInterfacesToTargetState(
    cma,
    get(targetState, ['EditorInterface'], {}),
    widgetId
  );

  evictWidget(appInstallation);
}

// Best effort uninstallation.
export async function uninstall(cma, evictWidget, checkAppStatus) {
  const { appInstallation, appDefinition } = await checkAppStatus();

  if (appInstallation) {
    const { widgetId } = appInstallation.sys;

    // Rewrite all EditorInterfaces refering the app widget.
    await removeAllEditorInterfaceReferences(cma, widgetId);

    // Remove the AppInstallation itself.
    await cma.deleteAppInstallation(appDefinition.sys.id);
    evictWidget(appInstallation);
  }
}
