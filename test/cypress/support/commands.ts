// add new command to the existing Cypress interface
declare global {
  namespace Cypress {
    interface Chainable {
      setAuthTokenToLocalStorage: typeof setAuthTokenToLocalStorage;
      disableConsentManager: typeof disableConsentManager;
      enableFeatureFlags: typeof enableFeatureFlags;
      disableFeatureFlags: typeof disableFeatureFlags;
      verifyNotification: typeof verifyNotification;
    }
  }
  interface Window {
    fetch: any;
    eval: any;
    unfetch: any;
  }
}

/**
 * Custom cypress command for app authentication
 *
 * @returns {void}
 * @example cy.setAuthTokenToLocalStorage()
 */
export function setAuthTokenToLocalStorage() {
  const TOKEN = Cypress.env('token');
  window.localStorage.setItem('token', TOKEN);
}

/**
 * Custom command to disable the cookie consent manager (Osano)
 *
 * @returns {void}
 */
export function disableConsentManager() {
  window.localStorage.setItem('__disable_consentmanager', 'true');
}

export function disableDegradedAppPerformance() {
  window.localStorage.setItem('__disable_degraded_app_performance', 'true');
}

/**
 * Enable app feature flag
 *
 * @returns {void}
 * @example
 * import { FeatureFlag } from '../util/featureFlag';
 * cy.enableFeatureFlags([FeatureFlag.ENVIRONMENTS])
 */
export function enableFeatureFlags(flags: Array<string>): void {
  const enabled = JSON.parse(window.localStorage.getItem('ui_enable_flags') || '[]');
  const merged = Cypress._.union(enabled, flags);
  window.localStorage.setItem('ui_enable_flags', JSON.stringify(merged));
}

export function disableFeatureFlags(flags: Array<string>): void {
  const enabled = JSON.parse(window.localStorage.getItem('ui_disable_flags') || '[]');
  const merged = Cypress._.union(enabled, flags);
  window.localStorage.setItem('ui_disable_flags', JSON.stringify(merged));
}

export function verifyNotification(type: 'success' | 'error', message: string) {
  cy.findByTestId('cf-ui-notification')
    .should('contain', message)
    .should('have.attr', 'data-intent')
    .and('be.eq', type);
}

Cypress.Commands.add('setAuthTokenToLocalStorage', setAuthTokenToLocalStorage);
Cypress.Commands.add('disableConsentManager', disableConsentManager);
Cypress.Commands.add('disableDegradedAppPerformance', disableDegradedAppPerformance);
Cypress.Commands.add('enableFeatureFlags', enableFeatureFlags);
Cypress.Commands.add('disableFeatureFlags', disableFeatureFlags);
Cypress.Commands.add('verifyNotification', verifyNotification);
