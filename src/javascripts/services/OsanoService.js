/*
  Osano is our consent management SaaS tool, which we use to gather consent for
  various things -- analytics and personalization scripts -- before loading them.

  This is now the only place where analytics and Intercom are enabled.
 */

import { fromPairs } from 'lodash';
import * as LazyLoader from 'utils/LazyLoader';
import isAnalyticsAllowed from 'analytics/isAnalyticsAllowed';
import * as Analytics from 'analytics/Analytics';
import segment from 'analytics/segment';
import * as Intercom from 'services/intercom';
import { Notification } from '@contentful/forma-36-react-components';
import { getUserSync } from 'services/TokenStore';
import { updateUserData } from 'app/UserProfile/Settings/AccountRepository';
import * as logger from 'services/logger';
import { debounce } from 'lodash';
import { getBrowserStorage } from 'core/services/BrowserStorage';

const localStorage = getBrowserStorage();

// The cookie and localStorage key name
const STORAGE_KEY = 'cf_webapp_cookieconsent';

// The Osano "Consent Manager" object
let cm = null;

// To tell if consent has been initalized yet or not
let initialized = false;

// Function to handle resetting `cm` in testing
export const __reset = () => {
  cm = null;
  initialized = false;
};

export async function handleInitialize() {
  // Initialization happens in ClientController, and only happens after the user is available to us, so we
  // can safely synchronously get the user.
  const user = getUserSync();
  // If consent has already been initialized, return. Or if user hasn't consented yet, return wait for that, then initialize consent.
  if (initialized || !hasUserConsented(user)) {
    return;
  }

  const localConsent = cm.storage.getConsent();

  const analyticsAllowed = isAnalyticsAllowed(user) && localConsent.ANALYTICS === 'ACCEPT';
  const personalizationAllowed = localConsent.PERSONALIZATION === 'ACCEPT';

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

  initialized = true;
}

// Exported for testing
export const handleConsentChanged = debounce(async function debouncedHandleConsentChanged() {
  const user = getUserSync();

  await updateGKConsent(user);

  if (initialized) {
    // If the consent options changed, we need to reload because we can't unload existing scripts like GA, Intercom.
    Notification.warning('Reload the app to apply your new preferences.');
  }

  handleInitialize();
}, 500);

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

  // Since we override `storage.key` above after instantiating `cm`, we also
  // set the existing options to the values in localStorage.
  const existingOpts = localStorage.get(STORAGE_KEY);

  if (existingOpts) {
    cm.storage.setConsent(existingOpts);
  }

  // Do before calling readyCb and setting the event listeners below.
  await setupLocalConsent(getUserSync());

  // Setup listeners before readyCb, so that we get the `osano-cm-initialized` event.
  cm.on('osano-cm-initialized', handleInitialize);
  cm.on('osano-cm-consent-saved', handleConsentChanged);

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

function setupLocalConsent(user) {
  if (user.cookieConsentData) {
    // The consent has been saved previously, set it locally.
    updateLocalConsent(user);
  } else if (isConsentSavedLocally()) {
    // Looks like the user consented previously but it's not in GK yet, update GK
    updateGKConsent(user);
  } else {
    // No consent is present yet, we don't need to do anything
  }
}

export async function updateGKConsent(user) {
  const data = {
    cookieConsentData: JSON.stringify({
      consent: cm.storage.getConsent(),
      uuid: cm.storage.getUUID(),
      expirationDate: cm.storage.getExpDate(),
    }),
  };

  try {
    await updateUserData({
      version: user.sys.version,
      data,
    });
  } catch (e) {
    logger.logError(e);
  }
}

// Save consent to local Osano ConsentManager instance
function updateLocalConsent(user) {
  const { consent, uuid, expirationDate } = JSON.parse(user.cookieConsentData);
  const expirationDateInt = parseInt(expirationDate);

  cm.storage.setConsent(consent);
  cm.storage.uuid = uuid;
  cm.storage.saveConsent(expirationDateInt);
}

function hasUserConsented(user) {
  return isConsentSavedInGK(user) || isConsentSavedLocally();
}

function isConsentSavedInGK(user) {
  return user.cookieConsentData != null;
}

function isConsentSavedLocally() {
  // If cm.storage.getExpDate() === 0, then there is no consent yet saved for this user and we should check if we have saved consent data in GK
  return cm.storage.getExpDate() !== 0;
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
    'Amazon Kinesis Firehose': analyticsAllowed,
    'Amazon S3': analyticsAllowed,
    Intercom: personalizationAllowed,
    Wootric: personalizationAllowed,
  });

  return {
    integrations: integrationOption,
  };
}
