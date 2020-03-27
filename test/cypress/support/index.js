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

import { FeatureFlag } from '../util/featureFlag';

Cypress.env('pactDir', Cypress.env('PACT_DIR') ? String(Cypress.env('PACT_DIR')) : 'pacts');

before(() => cy.startGateway(5000));
before(() => {
  cy.startFakeServers({
    consumer: 'user_interface',
    providers: ['enforcements', 'environments', 'content_types', 'locales', 'token'],
    cors: true,
    pactfileWriteMode: 'merge',
    dir: Cypress.env('pactDir'),
    spec: 2,
  });
});
beforeEach(() => {
  cy.setAuthTokenToLocalStorage();
  cy.disableConsentManager();

  // set default feature flags enabled on LaunchDarkly
  cy.enableFeatureFlags([FeatureFlag.DEFAULT]);
});
afterEach(() => {
  cy.verifyAllFakeServerInteractions();
  cy.writeAllFakeServerPacts();
});
after(() => cy.writePactsAndStopAllFakeServers());
after(() => cy.stopGateway());
