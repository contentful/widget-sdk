import * as LazyLoader from 'utils/LazyLoader';
import { getStore } from 'browserStorage';

const localStorage = getStore();

// cm is Osano's cookie maangement api
let cm = null;

export async function init() {
  const Osano = await LazyLoader.get('osano');

  // Get the original options and teardown the injected script
  // generated Cosnent Manager instance
  const options = Osano.cm.options;
  Osano.cm.teardown();

  // Override `whenReady` so that we can set the cookie key, which isn't
  // able to be set using the options object
  let readyCb;
  Osano.ConsentManager.prototype.whenReady = (cb) => {
    readyCb = cb;
  };

  // Create a new ConsentManager instance
  cm = new Osano.ConsentManager(options);

  // Rename the cookie/local storage key to not clash with marketing website
  cm.storage.key = 'cf_webapp_cookieconsent';
  readyCb();

  // Hide the "Marketing" toggles
  const marketingToggles = document.querySelectorAll("input[data-category='MARKETING']");

  if (marketingToggles.length > 0) {
    marketingToggles.forEach((toggle) => {
      toggle.parentElement.parentElement.style.display = 'none';
    });
  }

  // This allows us to programmatically disable the consent manager during testing
  if (localStorage.has('__disable_consentmanager')) {
    cm.teardown();
  }

  return cm;
}

export async function waitForCMInstance(tries = 0) {
  if (tries > 10) {
    throw new Error('Osano failed to load');
  }

  // If Osano hasn't loaded yet, try to wait for it to load
  if (!cm) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return waitForCMInstance(tries + 1);
  }
}

export function openConsentManagementPanel() {
  // Opens Osano's cookie management side bar
  cm.emit('osano-cm-dom-info-dialog-open');
}
