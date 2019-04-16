// add new command to the existing Cypress interface
declare global {
  namespace Cypress {
    interface Chainable {
      setAuthTokenToLocalStorage: typeof setAuthTokenToLocalStorage;
    }
  }
  interface Window {
    fetch: any;
    eval: any;
    unfetch: any;
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
