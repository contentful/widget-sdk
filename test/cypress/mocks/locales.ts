import * as state from './interactionState';

const locales = require('../fixtures/locales.json');
const spaceId = Cypress.env('spaceId');

export function defaultLocaleResponse() {
  cy.addInteraction({
    state: state.Locales.DEFAULT,
    uponReceiving: 'a request for all locales',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/locales`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: locales
    }
  }).as(state.Locales.DEFAULT);
}
