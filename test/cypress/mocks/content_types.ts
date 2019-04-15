const empty = require('../fixtures/empty.json');
const singleCt = require('../fixtures/singleCt.json');
const editorInterfaceResponseBody = require('../fixtures/editor_interface.json');
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

export function singleContentTypeResponse() {
  cy.addInteraction({
    state: 'singlePublicContentType',
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
      body: singleCt
    }
  }).as('publicContentTypes');
}

export function editorInterfaceResponse() {
  cy.addInteraction({
    state: 'editorInterface',
    uponReceiving: 'a request for editor interfaces',
    withRequest: {
      method: 'GET',
      path: `/spaces/${spaceId}/content_types/testContentType/editor_interface`,
      headers: {
        Accept: 'application/json, text/plain, */*'
      }
    },
    willRespondWith: {
      status: 200,
      body: editorInterfaceResponseBody
    }
  }).as('editorInterface');
}
