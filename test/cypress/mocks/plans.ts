import * as state from './interactionState';

const plans = require('../fixtures/plans.json');
const orgId = Cypress.env('orgId');

export function freePlanResponse() {
  cy.addInteraction({
    state: state.Plans.FREE,
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
  }).as(state.Plans.FREE);
}
