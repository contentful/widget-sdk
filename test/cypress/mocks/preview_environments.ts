import * as state from './interactionState';

const empty = require('../fixtures/empty.json');
const spaceId = Cypress.env('spaceId');

export function noPreviewEnvironmentsResponse() {
  cy.addInteraction({
    state: state.PreviewEnvironments.NONE,
    uponReceiving: 'a request for all preview environments',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/preview_environments`,
      query: {
        limit: '100'
      },
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as(state.PreviewEnvironments.NONE);
}
