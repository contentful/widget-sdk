/*
  Osano is our consent management SaaS tool, which we use to gather consent for
  various things -- analytics and personalization scripts -- before loading them.

  This is now the only place where analytics and Intercom are enabled.
 */

import { fromPairs } from 'lodash';
import * as LazyLoader from 'utils/LazyLoader';
import { getUserSync } from 'services/TokenStore';
import isAnalyticsAllowed from 'analytics/isAnalyticsAllowed';
import * as Analytics from 'analytics/Analytics';
import segment from 'analytics/segment';
import * as Intercom from 'services/intercom';
import { Notification } from '@contentful/forma-36-react-components';
import { getStore } from 'browserStorage';

const localStorage = getStore();

// The cookie and localStorage key name
const STORAGE_KEY = 'cf_webapp_cookieconsent';

// The Osano "Consent Manager" object
let cm = null;

// Previously saved consent options
let prevConsentOptions = null;

// Function to handle resetting `cm` in testing
export const __reset = () => {
  cm = null;
  prevConsentOptions = null;
};

// Debounce handleConsentChanged in case the script initializes and the user consents within
// two seconds
//
// Exported for testing
export const handleConsentChanged = async function debouncedHandleConsentChanged(
  newConsentOptions
) {
  if (!newConsentOptions) {
    // This listener is setup to be called on Osano initialization and consent change. If the
    // user has not consented before, `newConsentOptions` will be undefined on initialization,
    // and so we don't do anything in this handler.
    return;
  }

  // Initialization happens in ClientController, and only happens after the user is available to us, so we
  // can safely synchronously get the user.
  const user = getUserSync();
  const analyticsAllowed = isAnalyticsAllowed(user) && newConsentOptions.ANALYTICS === 'ACCEPT';
  const personalizationAllowed = newConsentOptions.PERSONALIZATION === 'ACCEPT';

  if (prevConsentOptions) {
    const prevAnalyticsAllowed = prevConsentOptions.analyticsAllowed;
    const prevPersonalizationAllowed = prevConsentOptions.personalizationAllowed;

    let changed = false;

    if (
      prevAnalyticsAllowed !== analyticsAllowed ||
      prevPersonalizationAllowed !== personalizationAllowed
    ) {
      changed = true;
    }

    if (changed) {
      // If the consent options changed, we need to reload because we can't unload existing scripts like GA, Intercom.
      Notification.warning('Reload the app to apply your new preferences.');
    }

    // Regardless if a notification is shown, we do not want to run any of the logic below, since it
    // will break things (for example, Segment cannot be initialized twice).
    return;
  }

  prevConsentOptions = {
    analyticsAllowed,
    personalizationAllowed,
  };

  const segmentLoadOptions = await generateSegmentLoadOptions(
    analyticsAllowed,
    personalizationAllowed
  );

  if (analyticsAllowed) {
    Analytics.enable(user, segmentLoadOptions);
  } else if (personalizationAllowed) {
    // Since analytics isn't allowed, but personalization (Intercom + Wootric) is,
    // we load Segment directly
    segment.enable(segmentLoadOptions);
  }

  if (personalizationAllowed) {
    Intercom.enable();
  }
};

export async function init() {
  if (cm) {
    return;
  }

  const Osano = await LazyLoader.get('osano');

  // Get the original options and teardown the injected script
  // generated Cosnent Manager instance
  const options = Osano.cm.options;

  try {
    Osano.cm.teardown();
  } catch {
    // We don't care if teardown fails. It is likely to have failed if we call
    // `teardown` before everything is attached, which is okay in this case.
  }

  // Override `whenReady` so that we can set the cookie key, which isn't
  // able to be set using the options object
  let readyCb;
  Osano.ConsentManager.prototype.whenReady = (cb) => {
    readyCb = cb;
  };

  // Create a new ConsentManager instance
  cm = new Osano.ConsentManager(options);

  // Rename the cookie/local storage key to not clash with marketing website
  cm.storage.key = STORAGE_KEY;

  // Setup listeners before readyCb, so that we get the `osano-cm-initialized` event.
  cm.on('osano-cm-initialized', handleConsentChanged);
  cm.on('osano-cm-consent-saved', handleConsentChanged);

  // Since we override `storage.key` above after instantiating `cm`, we also
  // set the existing options to the values in localStorage.
  const existingOpts = localStorage.get(STORAGE_KEY);

  if (existingOpts) {
    cm.storage.setConsent(existingOpts);
  }

  // Only call the readyCb exists
  readyCb && readyCb();

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
  if (tries === 10) {
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

async function generateSegmentLoadOptions(analyticsAllowed, personalizationAllowed) {
  const allIntegrations = await segment.getIntegrations();

  // Map the integrations so that they are now pairs of [integrationName, false]
  // and turn those pairs into an object that looks like:
  //
  // {
  //   integrationName: false
  // }

  const mappedIntegrations = fromPairs(allIntegrations.map((item) => [item, false]));

  // Take all integrations and only enable the ones that the user has explicitly opted into
  const integrationOption = Object.assign({}, mappedIntegrations, {
    all: false,
    FullStory: analyticsAllowed,
    'Segment.io': analyticsAllowed,
    'Google Analytics': analyticsAllowed,
    Intercom: personalizationAllowed,
  });

  return {
    integrations: integrationOption,
  };
}
