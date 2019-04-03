const empty = require('../fixtures/empty.json');

const spaceId = Cypress.env('spaceId');

export const noPreviewEnvironmentsAlias = 'noPreviewEnvironments';

export function noPreviewEnvironmentsResponse() {
  cy.addInteraction({
    state: 'noPreviewEnvironments',
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
  }).as(noPreviewEnvironmentsAlias);
}
