import * as state from '../util/interactionState';
import {
  getPublicContentTypes,
  getEditorInterface,
  getContentTypes,
  getContentType,
  getContentTypePublished,
  defaultSpaceId,
  defaultContentTypeId,
  putContentType,
  putContentTypePublished,
  putEditorInterface
} from '../util/requests';

const empty = require('../fixtures/responses/empty.json');
const contentTypeSingle = require('../fixtures/responses/content-types-single.json');
const editorInterfaceWithoutSidebarResponseBody = require('../fixtures/responses/editor-interface-without-sidebar.json');
const editorInterfaceWithSidebarResponseBody = require('../fixtures/responses/editor-interface-with-sidebar.json');
const contentType = require('../fixtures/responses/content-type.json');
const query = {
  limit: '1000'
};
const contentTypeWithCustomSidebarRequestBody = require('../fixtures/requests/content-type-with-custom-sidebar.json');
const editorInterfaceWithCustomSidebarRequestBody = require('../fixtures/requests/editor-interface-with-custom-sidebar.json');
const editorInterfaceWithCustomSidebarResponseBody = require('../fixtures/responses/editor-interface-with-custom-sidebar.json');

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
    uponReceiving: 'a request for a single public content types',
    withRequest: getPublicContentTypes(defaultSpaceId, query),
    willRespondWith: {
      status: 200,
      body: contentTypeSingle
    }
  }).as(state.PublicContentTypes.SINGLE);
}

export function editorInterfaceWithoutSidebarResponse() {
  cy.addInteraction({
    provider: 'content_types',
    state: state.ContentTypes.EDITORINTERFACE_WITHOUT_SIDEBAR,
    uponReceiving: 'a request for editor interfaces',
    withRequest: getEditorInterface(),
    willRespondWith: {
      status: 200,
      body: editorInterfaceWithoutSidebarResponseBody
    }
  }).as(state.ContentTypes.EDITORINTERFACE_WITHOUT_SIDEBAR);
}

export function editorInterfaceWithSidebarResponse() {
  cy.addInteraction({
    provider: 'content_types',
    state: state.ContentTypes.EDITORINTERFACE_WITH_SIDEBAR,
    uponReceiving: 'a request for editor interfaces',
    withRequest: getEditorInterface(),
    willRespondWith: {
      status: 200,
      body: editorInterfaceWithSidebarResponseBody
    }
  }).as(state.ContentTypes.EDITORINTERFACE_WITH_SIDEBAR);
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

export function defaultContentTypeResponse() {
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

export function defaultPublishedContentTypeResponse() {
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

export function defaultContentTypeWithCustomSidebarCreatedResponse() {
  cy.addInteraction({
    provider: 'content_types',
    state: state.ContentType.DEFAULT,
    uponReceiving: 'a put request for saving content type with custom sidebar',
    withRequest: putContentType(
      defaultContentTypeId,
      defaultSpaceId,
      contentTypeWithCustomSidebarRequestBody
    ),
    willRespondWith: {
      status: 200,
      body: contentType
    }
  }).as('content-type-custom-sidebar-created');
}

export function defaultPublishedContentTypeWithCustomSidebarCreatedResponse() {
  cy.addInteraction({
    provider: 'content_types',
    state: state.ContentType.DEFAULT,
    uponReceiving: 'a put request for saving published content type with custom sidebar',
    withRequest: putContentTypePublished(defaultContentTypeId, defaultSpaceId),
    willRespondWith: {
      status: 200,
      body: contentType
    }
  }).as('content-type-published-custom-sidebar-created');
}

export function editorInterfaceWithCustomSidebarSavedResponse() {
  cy.addInteraction({
    provider: 'content_types',
    state: state.ContentTypes.EDITORINTERFACE_WITHOUT_SIDEBAR,
    uponReceiving: 'a put request for saving editor interface with custom sidebar',
    withRequest: putEditorInterface(
      defaultContentTypeId,
      defaultSpaceId,
      editorInterfaceWithCustomSidebarRequestBody
    ),
    willRespondWith: {
      status: 200,
      body: editorInterfaceWithCustomSidebarResponseBody
    }
  }).as('editor-interface-sidebar-saved');
}
