import * as state from '../util/interactionState';
import {
  getPublicContentTypes,
  getEditorInterface,
  getContentTypes,
  getContentType,
  getContentTypePublished,
  defaultSpaceId
} from '../util/requests';

const empty = require('../fixtures/empty.json');
const contentTypeSingle = require('../fixtures/content-types-single.json');
const editorInterfaceResponseBody = require('../fixtures/editor-interface.json');
const contentType = require('../fixtures/content-type.json');
const query = 'limit=1000';

export function noPublicContentTypesResponse() {
  return cy
    .addInteraction({
      provider: 'content_types',
      state: state.PublicContentTypes.NONE,
      uponReceiving: 'a request for all public content types',
      withRequest: getPublicContentTypes(defaultSpaceId, query),
      willRespondWith: {
        status: 200,
        body: empty
      }
    })
    .as(state.PublicContentTypes.NONE);
}

export function singleContentTypeResponse() {
  cy.addInteraction({
    provider: 'content_types',
    state: state.ContentTypes.SINGLE,
    uponReceiving: 'a request for all public content types',
    withRequest: getPublicContentTypes(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: contentTypeSingle
    }
  }).as(state.PublicContentTypes.SINGLE);
}

export function editorInterfaceResponse() {
  cy.addInteraction({
    provider: 'content_types',
    state: state.ContentTypes.EDITORINTERFACE,
    uponReceiving: 'a request for editor interfaces',
    withRequest: getEditorInterface(),
    willRespondWith: {
      status: 200,
      body: editorInterfaceResponseBody
    }
  }).as(state.ContentTypes.EDITORINTERFACE);
}

export function allContentTypesResponse() {
  cy.addInteraction({
    provider: 'content_types',
    state: state.ContentTypes.SINGLE,
    uponReceiving: 'a request for a list of all content types',
    withRequest: getContentTypes(),
    willRespondWith: {
      status: 200,
      body: contentTypeSingle
    }
  }).as(state.ContentTypes.SINGLE);
}

export function concreteContentTypeResponse() {
  cy.addInteraction({
    provider: 'content_types',
    state: state.ContentType.DEFAULT,
    uponReceiving: 'a request for a conrete content type',
    withRequest: getContentType(),
    willRespondWith: {
      status: 200,
      body: contentType
    }
  }).as(state.ContentType.DEFAULT);
}

export function concretePublishedContentTypeResponse() {
  cy.addInteraction({
    provider: 'content_types',
    state: state.ContentType.PUBLISHED,
    uponReceiving: 'a request for a published version of concrete content type',
    withRequest: getContentTypePublished(),
    willRespondWith: {
      status: 200,
      body: contentType
    }
  }).as('publishedContentType');
}
