import * as LazyLoader from 'utils/LazyLoader';

// cm is Osano's cookie maangement api
let cm = null;

export async function init() {
  cm = (await LazyLoader.get('osano')).cm;

  return cm;
}

export async function waitForCMInstance(tries = 0) {
  if (tries > 10) {
    throw new Error('Osano failed to load');
  }

  // If Osano hasn't loaded yet, try to wait for it to load
  if (!cm) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return waitForCMInstance(tries + 1);
  }
}

export function openConsentManagementPanel() {
  // Opens Osano's cookie management side bar
  cm.emit('osano-cm-dom-info-dialog-open');
}
