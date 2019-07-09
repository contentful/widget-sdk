// add new command to the existing Cypress interface
declare global {
  namespace Cypress {
    interface Chainable {
      setAuthTokenToLocalStorage: typeof setAuthTokenToLocalStorage;
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
  const enabled = JSON.parse(window.localStorage.getItem('ui_enable_flags') || '[]');
  let sorted = enabled.filter(function(el) {
    return !flags.includes(el);
  });
  window.localStorage.setItem('ui_enable_flags', JSON.stringify(sorted));
}

export function verifyNotification(type: 'success' | 'error', message: string) {
  cy.getByTestId('cf-ui-notification')
    .should('contain', message)
    .should('have.attr', 'data-intent')
    .and('be.eq', type);
}

Cypress.Commands.add('setAuthTokenToLocalStorage', setAuthTokenToLocalStorage);
Cypress.Commands.add('enableFeatureFlags', enableFeatureFlags);
Cypress.Commands.add('disableFeatureFlags', disableFeatureFlags);
Cypress.Commands.add('verifyNotification', verifyNotification);

Cypress.Commands.overwrite('visit', (visit, url) => {
  cy.readFile('test/cypress/support/unfetch.js').then(polyfill => {
    return visit(url, {
      onBeforeLoad(win: Window) {
        // Cypress cannot capture fetch requests.
        // See https://github.com/cypress-io/cypress/issues/95.
        // What we do here is we unset the default fetch
        // and polyfill with unfetch which uses XHR which
        // can be captured.
        delete win.fetch;
        win.eval(polyfill);
      }
    });
  });
});
