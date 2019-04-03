const locales = require('../fixtures/locales.json');
const spaceId = Cypress.env('spaceId');

export function defaultLocaleResponse() {
  cy.addInteraction({
    state: 'oneLocale',
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
  }).as('locales');
}
