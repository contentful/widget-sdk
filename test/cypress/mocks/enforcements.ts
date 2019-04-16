import * as state from './interactionState';

const empty = require('../fixtures/empty.json');
const spaceId = Cypress.env('spaceId');

export function noEnforcementsResponse() {
  cy.addInteraction({
    state: state.Enforcements.NONE,
    uponReceiving: 'a request for all enforcements',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/enforcements`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.Enforcements.NONE);
}
