declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Quickly log into the app. Used in most specs, with the exception being the actual login spec.
       *
       * @example
       * ```
       * it('should successfully create an entry', () => {
       *   cy.login();
       *
       *   cy.visit(`/spaces/${spaceId}/entries`);
       * })
       * ```
       */
      login: () => void;
    }
  }
}

import '@testing-library/cypress/add-commands';
import { LoginPage } from '../pages';

import { configure } from '@testing-library/cypress';
configure({ testIdAttribute: 'data-test-id' });

Cypress.Commands.add('login', () => {
  const loginPage = LoginPage.visit();

  loginPage.emailField.type(Cypress.env('email'));
  loginPage.passwordField.type(Cypress.env('password'));
  loginPage.submitFormQuick();
});
