// add new command to the existing Cypress interface
declare global {
    namespace Cypress {

        interface Chainable {
            login: typeof login
        }
    }
}
/**
 * Custom cypress command for login
 *
 * @returns {void}
 * @example cy.login()
 */
export function login() {
    const TOKEN = Cypress.env('token');
    window.sessionStorage.setItem('token', TOKEN)
}

Cypress.Commands.add('login', login)
