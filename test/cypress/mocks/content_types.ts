const empty = require('../fixtures/empty.json');
const spaceId = Cypress.env('spaceId');

export function noPublicContentTypesResponse() {
  cy.addInteraction({
    state: 'noPublicContentTypes',
    uponReceiving: 'a request for all public content types',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/public/content_types`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      },
      query: 'limit=1000'
    },
    willRespondWith: {
      status: 200,
      body: empty
    }
  }).as('publicContentTypes');
}
