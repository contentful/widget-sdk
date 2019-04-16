import * as state from './interactionState';

const empty = require('../fixtures/empty.json');
const singleCt = require('../fixtures/singleCt.json');
const editorInterfaceResponseBody = require('../fixtures/editor_interface.json');
const spaceId = Cypress.env('spaceId');

export function noPublicContentTypesResponse() {
  cy.addInteraction({
    state: state.ContentTypes.NONE,
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
  }).as(state.ContentTypes.NONE);
}

export function singleContentTypeResponse() {
  cy.addInteraction({
    state: state.ContentTypes.SINGLE,
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
  }).as(state.ContentTypes.SINGLE);
}

export function editorInterfaceResponse() {
  cy.addInteraction({
    state: state.ContentTypes.EDITORINTERFACE,
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
  }).as(state.ContentTypes.EDITORINTERFACE);
}
