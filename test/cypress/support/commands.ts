// add new command to the existing Cypress interface
declare global {
  namespace Cypress {
    interface Chainable {
      setAuthToken: typeof setAuthToken;
    }
  }
}
/**
 * Custom cypress command for login
 *
 * @returns {void}
 * @example cy.login()
 */
export function setAuthToken() {
  const TOKEN = Cypress.env('token');
  window.sessionStorage.setItem('token', TOKEN);
}

Cypress.Commands.add('setAuthToken', setAuthToken);
