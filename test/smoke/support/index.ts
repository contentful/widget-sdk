declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Quickly log into the app. Used in most specs, with the exception being the actual login spec.
       *
       * @example
       * ```
       * test('entry-status-change', () => {
       *   cy.login();
       *
       *   cy.visit(`/spaces/${spaceId}/entries`);
       * })
       * ```
       */
      login: typeof loginCommand;

      /**
       * Measure a single measurement using Librato.
       *
       * @example
       *
       * ```
       * test('a-test', () => {
       *   cy.measure('a-test', 'my-measurement', 7);
       * })
       */
      measure: typeof measureCommand;
    }
  }
}

import '@testing-library/cypress/add-commands';
import { LoginPage } from '../pages';

import { configure } from '@testing-library/cypress';
configure({ testIdAttribute: 'data-test-id' });

// To make it nicer to work with in the specs, so that we don't have to type
// it('login')
global.test = global.it;

function loginCommand() {
  const loginPage = LoginPage.visit();

  loginPage.emailField.type(Cypress.env('email'));
  loginPage.passwordField.type(Cypress.env('password'));
  loginPage.submitFormQuick();
}

Cypress.Commands.add('login', loginCommand);

function measureCommand(testName: string, metricName: string, value: number) {
  const name = `${testName}.${metricName}`;

  cy.task('measure', { name, value });
}

Cypress.Commands.add('measure', measureCommand);
