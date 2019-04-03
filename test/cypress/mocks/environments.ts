const environments = require('../fixtures/environments.json');
const spaceId = Cypress.env('spaceId');

export function masterEnvironmentResponse() {
  cy.addInteraction({
    state: 'masterEnvironment',
    uponReceiving: 'a request for all environments',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/environments`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: environments
    }
  }).as('environments');
}
