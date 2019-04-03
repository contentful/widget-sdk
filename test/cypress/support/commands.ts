// add new command to the existing Cypress interface
declare global {
  namespace Cypress {
    interface Chainable {
      setAuthTokenToLocalStorage: typeof setAuthTokenToLocalStorage;
    }
  }
}
/**
 * Custom cypress command for login
 *
 * @returns {void}
 * @example cy.login()
 */
export function setAuthTokenToLocalStorage() {
  const TOKEN = Cypress.env('token');
  window.localStorage.setItem('token', TOKEN);
}

Cypress.Commands.add('setAuthTokenToLocalStorage', setAuthTokenToLocalStorage);
