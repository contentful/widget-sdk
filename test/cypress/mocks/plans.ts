const plans = require('../fixtures/plans.json');
const orgId = Cypress.env('orgId');

export function freePlanResponse() {
  cy.addInteraction({
    state: 'onePlan',
    uponReceiving: 'a request for all plans',
    withRequest: {
      method: 'GET',
      path: `/organizations/${orgId}/plans`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: plans
    }
  }).as('plans');
}
