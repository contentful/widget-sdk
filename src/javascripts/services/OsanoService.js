/*
  Osano is our consent management SaaS tool, which we use to gather consent for
  various things -- analytics and personalization scripts -- before loading them.

  This is now the central place where analytics and Intercom are enabled.
 */

import { debounce } from 'lodash';
import * as LazyLoader from 'utils/LazyLoader';
import { getUserSync } from 'services/TokenStore';
import isAnalyticsAllowed from 'analytics/isAnalyticsAllowed';
import * as Analytics from 'analytics/Analytics';
import segment from 'analytics/segment';
import * as Intercom from 'services/intercom';
import { Notification } from '@contentful/forma-36-react-components';
import { getStore } from 'browserStorage';

const localStorage = getStore();

// cm is Osano's cookie maangement api
let cm = null;
let consentOptions = null;

// Debounce handleConsentChanged in case the script initializes and the user consents within
// two seconds
const handleConsentChanged = debounce(function debouncedHandleConsentChanged(newConsentOptions) {
  // Initialization happens in ClientController, and only happens after the user is available to us, so we
  // can safely synchronously get the user.
  const user = getUserSync();
  const analyticsAllowed = isAnalyticsAllowed(user) && newConsentOptions.ANALYTICS === 'ACCEPT';
  const personalizationAllowed = newConsentOptions.PERSONALIZATION === 'ACCEPT';

  if (consentOptions) {
    // If the consent options, we need to reload because we can't unload existing scripts like GA, Intercom.

    // TODO: This message sounds a little weird in the context of our app...
    Notification.success(
      'Your preferences have been successfully saved. Reload the app to finish applying changes.'
    );
  }

  consentOptions = newConsentOptions;

  const segmentLoadOptions = {
    integrations: {
      all: false,
      'Segment.io': analyticsAllowed,
      'Google Analytics': analyticsAllowed,
      Intercom: personalizationAllowed,
    },
  };

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
}, 2000);

export async function init() {
  if (cm) {
    return;
  }

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

  // Rename the cookie/local storage key to not clash with marketing website
  cm.storage.key = 'cf_webapp_cookieconsent';

  cm.on('osano-cm-initialized', handleConsentChanged);
  cm.on('osano-cm-consent-changed', handleConsentChanged);
  cm.on('osano-cm-consent-saved', handleConsentChanged);

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
