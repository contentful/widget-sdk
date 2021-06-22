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
import { Notification } from '@contentful/forma-36-react-components';
import { getUserSync, refresh as refreshToken } from 'services/TokenStore';
import { updateUserData } from 'features/user-profile';
import { captureError } from 'core/monitoring';
import { debounce } from 'lodash';
import { getBrowserStorage } from 'core/services/BrowserStorage';

const localStorage = getBrowserStorage();

const CONSENT_KEY = 'osano_consentmanager';
const EXPIRATION_DATE_KEY = 'osano_consentmanager_expdate';
const UUID_KEY = 'osano_consentmanager_uuid';

// The Osano "Consent Manager" object
let cm = null;

let initialized = false;

/**
 * Function for resetting singleton during tests.
 * @return {void} [description]
 */
export function __reset() {
  cm = null;
  initialized = false;
}

/**
 * Handles when the `osano-cm-initialized` event fires.
 * @return {void}
 */
export async function handleInitialize() {
  // Only initialize once
  if (initialized) {
    return;
  }

  hideMarketingToggles();

  // Initialization happens in ClientController, and only happens after the user is available to us, so we
  // can safely synchronously get the user.
  const user = getUserSync();

  const localConsent = cm.getConsent();

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

  initialized = true;
}

/**
 * Handles when the `osano-cm-consent-saved` event is fired.
 *
 * Updates the consent if it has saved and shows a notification if the consent was changed and not migrated.
 *
 * Note: this event is always fired when Osano.cm finishes loading.
 * @return {void}
 */
export const handleConsentSaved = debounce(async function debouncedHandleConsentSaved() {
  const user = getUserSync();

  if (!hasConsentChanged(user)) {
    return;
  }

  const migrated = await persistConsent(user);

  // If the consent options changed and was not just migrated from the old to new GK consent JSON format, the user needs to reload
  // to unload already loaded scripts like GA, Intercom (these can't be removed otherwise).
  //
  // Since a migration can be considered the same as a consent record that didn't change we don't show the notification to prevent
  // users from seeing it when they load the app once this is in production.
  if (initialized && !migrated) {
    Notification.warning('Reload the app to apply your new preferences.');
  }

  handleInitialize();
}, 500);

/**
 * Initializes Osano. Is initialized in ClientController, and only once per app session.
 * @return {void}
 */
export async function init() {
  // Do not run init if we already did before, or if we specifically opt to disable (for example in testing)
  if (cm || localStorage.has('__disable_consentmanager')) {
    return;
  }

  const user = getUserSync();

  if (isConsentPersisted(user)) {
    // The consent has been saved previously, set it locally.
    const {
      userInterface: { rawConsentRecord, expirationDate, uuid },
    } = JSON.parse(user.cookieConsentData);

    localStorage.set(CONSENT_KEY, rawConsentRecord);
    localStorage.set(EXPIRATION_DATE_KEY, expirationDate);
    localStorage.set(UUID_KEY, uuid);
  } else if (isLegacyConsentPersisted(user)) {
    const { consent, expirationDate, uuid } = JSON.parse(user.cookieConsentData);

    localStorage.set(CONSENT_KEY, consent);
    localStorage.set(EXPIRATION_DATE_KEY, expirationDate);
    localStorage.set(UUID_KEY, uuid);
  }

  const Osano = await LazyLoader.get('osano').catch(() => {});

  if (!Osano) {
    // There's nothing we can do it we couldn't load Osano, so just bail early
    //
    // This returns false for testing (it's ignored in app code)
    return false;
  }

  cm = Osano.cm;

  cm.on('osano-cm-initialized', handleInitialize);
  cm.on('osano-cm-consent-saved', handleConsentSaved);

  return cm;
}

/**
 * Determines if the user object has valid cookie consent data on it.
 * @param  {User}  user
 * @return {Boolean}
 */
function isConsentPersisted(user) {
  try {
    return !!JSON.parse(user.cookieConsentData)?.userInterface?.rawConsentRecord;
  } catch {
    return false;
  }
}

/**
 * Determines if the user object has a legacy consent record.
 * @param  {User}  user
 * @return {Boolean}
 */
function isLegacyConsentPersisted(user) {
  try {
    return !!JSON.parse(user.cookieConsentData)?.consent;
  } catch {
    //
  }
}

/**
 * Persist the current consent record in GK. Preserves consent that exists on other keys,
 * e.g. `cookieConsentData.webCreator`.
 *
 * If the consent is in the "old" format, meaning before migrating to the keyed `userInterface`
 * scope, it is considered "migrated".
 * @param  {User} user
 * @return {Boolean}      If the consent was migrated from the old format.
 */
export async function persistConsent(user) {
  // Is the current `user` consent the old format? If so, treat this as a "migration" and return true
  let migrated = false;
  let currentConsentData = {};

  if (!user.cookieConsentData) {
    // Osano always fires the save event initially, so we can treat nonexistent cookie consent data
    // as also being migrated.
    migrated = true;
  } else {
    try {
      currentConsentData = JSON.parse(user.cookieConsentData);

      if (currentConsentData.consent) {
        delete currentConsentData.consent;
        delete currentConsentData.expirationDate;
        delete currentConsentData.uuid;

        migrated = true;
      }
    } catch {
      // Doesn't matter if it fails to parse, we just update it below
    }
  }

  const data = {
    cookieConsentData: JSON.stringify({
      ...currentConsentData,
      userInterface: {
        rawConsentRecord: localStorage.get(CONSENT_KEY),
        expirationDate: localStorage.get(EXPIRATION_DATE_KEY),
        uuid: localStorage.get(UUID_KEY),
        consentRecord: cm.getConsent(),
      },
    }),
  };

  try {
    await updateUserData({
      version: user.sys.version,
      data,
    });
    await refreshToken();
  } catch (e) {
    captureError(e);
  }

  return migrated;
}

/**
 * Wait for Osano's cm (consent manager) instance to load. Will wait 1 second before throwing.
 * @param  {Number} tries Current number of tries
 */
export async function waitForCMInstance(tries = 0) {
  // Wait for Osano to load for 1 second or throw
  if (tries === 10) {
    throw new Error('Osano failed to load');
  }

  if (!cm) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return waitForCMInstance(tries + 1);
  }
}

/**
 * Determines if the consent has changed for this user.
 *
 * If the consent hasn't been persisted in GK, then no matter what it is considered to have
 * changed. If it is persisted, and either analytics or personalization has changed, then the
 * consent is considered changed. Otherwise, it is considered identical.
 * @param  {User}  user
 * @return {Boolean}
 */
function hasConsentChanged(user) {
  if (!isConsentPersisted(user)) {
    return true;
  }

  const { consentRecord: userConsent } = JSON.parse(user.cookieConsentData).userInterface;
  const instanceConsent = cm.getConsent();

  if (
    userConsent?.ANALYTICS !== instanceConsent.ANALYTICS ||
    userConsent?.PERSONALIZATION !== instanceConsent.PERSONALIZATION
  ) {
    return true;
  }

  return false;
}

/**
 * Open the consent management side panel and hide the marketing toggle that's visible in it.
 * @return {void}
 */
export function openConsentManagementPanel() {
  // Opens Osano's cookie management side bar
  cm.showDrawer();
  hideMarketingToggles();
}

/**
 * Hide vislble marketing toggles on the screen.
 *
 * @return {void}
 */
function hideMarketingToggles() {
  // Hide the "Marketing" toggles
  const marketingToggles = document.querySelectorAll("[data-category='MARKETING']");

  if (marketingToggles.length > 0) {
    marketingToggles.forEach((toggle) => {
      toggle.parentElement.parentElement.style.display = 'none';
    });
  }
}

/**
 * Generate options for Segment so that all integrations are disallowed by default, and enabled
 * only if the appropriate permission (analytics/personalization) allows it.
 * @param  {boolean} analyticsAllowed
 * @param  {boolean} personalizationAllowed
 * @return {SegmentOptions}
 */
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
    'LaunchDarkly Events': analyticsAllowed,
    Intercom: personalizationAllowed,
    Wootric: personalizationAllowed,
  });

  return {
    integrations: integrationOption,
  };
}
