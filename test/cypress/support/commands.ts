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
  cy.request('https://unpkg.com/unfetch/dist/unfetch.umd.js').then(response => {
    const polyfill = response.body;
    return visit(url, {
      onBeforeLoad(win: Window) {
        delete win.fetch;
        // since the application code does not ship with a polyfill
        // load a polyfilled "fetch" from the test
        win.eval(polyfill);
        win.fetch = win.unfetch;
      }
    });
  });
});
