// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

import 'cypress-testing-library/add-commands';

// set a custom test id
import { configure } from 'dom-testing-library';
configure({ testIdAttribute: 'data-test-id' });

// cypress-pact plugin
import '@contentful/cypress-pact/add-commands';

before(() => {
  cy.startPact({
    consumer: 'user_interface',
    provider: 'content-api',
    cors: true,
    port: 5000
  });
});
afterEach(() => cy.verifyPact());
after(() => cy.finalizePact());
