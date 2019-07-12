import * as state from '../util/interactionState';
import {
  defaultSpaceId,
  defaultContentType,
  defaultContentTypeId,
  defaultHeader
} from '../util/requests';
import { RequestOptions, Query } from '@pact-foundation/pact-web';

const empty = require('../fixtures/responses/empty.json');
const contentTypeSingle = require('../fixtures/responses/content-types-single.json');
const severalContentTypes = require('../fixtures/responses/content-types-several.json');
const editorInterfaceWithoutSidebarResponseBody = require('../fixtures/responses/editor-interface-without-sidebar.json');
const editorInterfaceWithSidebarResponseBody = require('../fixtures/responses/editor-interface-with-sidebar.json');
const contentTypeWithCustomSidebarRequestBody = require('../fixtures/requests/content-type-with-custom-sidebar.json');
const editorInterfaceWithCustomSidebarRequestBody = require('../fixtures/requests/editor-interface-with-custom-sidebar.json');
const editorInterfaceWithCustomSidebarResponseBody = require('../fixtures/responses/editor-interface-with-custom-sidebar.json');

const getAllPublicContentTypesInDefaultSpaceRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/public/content_types`,
  headers: defaultHeader,
  query: {
    limit: '1000'
  }
}

export const getAllPublicContentTypesInDefaultSpace = {
  willReturnNoContentTypes() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.PublicContentTypes.NONE,
      uponReceiving: `a request for all public content types in space "${defaultSpaceId}"`,
      withRequest: getAllPublicContentTypesInDefaultSpaceRequest,
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.PublicContentTypes.NONE);
  },
  willReturnOneContentType() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.PublicContentTypes.SINGLE,
      uponReceiving: `a request for all public content types in space "${defaultSpaceId}"`,
      withRequest: getAllPublicContentTypesInDefaultSpaceRequest,
      willRespondWith: {
        status: 200,
        body: contentTypeSingle
      }
    }).as(state.PublicContentTypes.SINGLE);
  }
}

function getAllContentTypesInDefaultSpaceRequest(query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/content_types`,
    headers: defaultHeader,
    query
  };
}

export const getAllContentTypesInDefaultSpace = {
  willReturnNoContentTypes() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.ContentTypes.NONE,
      uponReceiving: `a request for all content types in space "${defaultSpaceId}"`,
      withRequest: getAllContentTypesInDefaultSpaceRequest(),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.ContentTypes.NONE);
  },
  willReturnOneContentType() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.ContentTypes.SINGLE,
      uponReceiving: `a request for all content types in space "${defaultSpaceId}"`,
      withRequest: getAllContentTypesInDefaultSpaceRequest(),
      willRespondWith: {
        status: 200,
        body: contentTypeSingle
      }
    }).as(state.ContentTypes.SINGLE);
  }
}

export const getFirst1000ContentTypesInDefaultSpaceOrderedByName = {
  willReturnNoContentTypes() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.ContentTypes.NONE,
      uponReceiving: `a request for the first 1000 content types in space "${defaultSpaceId}" ordered by name`,
      withRequest: getAllContentTypesInDefaultSpaceRequest({
        limit: '1000',
        order: 'name'
      }),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as(state.ContentTypes.NONE);
  },
  willReturnSeveralContentTypes() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.ContentTypes.SEVERAL,
      uponReceiving: `a request for the first 1000 content types in space "${defaultSpaceId}" ordered by name`,
      withRequest: getAllContentTypesInDefaultSpaceRequest({
        limit: '1000',
        order: 'name'
      }),
      willRespondWith: {
        status: 200,
        body: severalContentTypes
      }
    }).as(state.ContentTypes.SEVERAL);
  }
}

const getEditorInterfaceForDefaultContentTypeRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/editor_interface`,
  headers: defaultHeader
}

export const getEditorInterfaceForDefaultContentType = {
  willReturnOneWithoutSidebar() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.ContentTypes.EDITORINTERFACE_WITHOUT_SIDEBAR,
      uponReceiving: `a request for the editor interface of content type "${defaultContentTypeId}" in space "${defaultSpaceId}"`,
      withRequest: getEditorInterfaceForDefaultContentTypeRequest,
      willRespondWith: {
        status: 200,
        body: editorInterfaceWithoutSidebarResponseBody
      }
    }).as(state.ContentTypes.EDITORINTERFACE_WITHOUT_SIDEBAR);
  },
  willReturnOneWithSidebar() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.ContentTypes.EDITORINTERFACE_WITH_SIDEBAR,
      uponReceiving: `a request for the editor interface of content type "${defaultContentTypeId}" in space "${defaultSpaceId}"`,
      withRequest: getEditorInterfaceForDefaultContentTypeRequest,
      willRespondWith: {
        status: 200,
        body: editorInterfaceWithSidebarResponseBody
      }
    }).as(state.ContentTypes.EDITORINTERFACE_WITH_SIDEBAR);
  }
}

export const getDefaultContentTypeInDefaultSpace = {
  willReturnTheDefaultContentType() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.ContentTypes.SEVERAL,
      uponReceiving: `a request to get content type "${defaultContentTypeId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}`,
        headers: defaultHeader
      },
      willRespondWith: {
        status: 200,
        body: defaultContentType
      }
    }).as(state.ContentTypes.SEVERAL);
  }
}

export const getPublishedVersionOfDefaultContentType = {
  willReturnThePublishedVersion() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.ContentTypes.DEFAULT_CONTENT_TYPE_IS_PUBLISHED,
      uponReceiving: `a request to get the published version of content type "${defaultContentTypeId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/published`,
        headers: defaultHeader
      },
      willRespondWith: {
        status: 200,
        body: defaultContentType
      }
    }).as(state.ContentTypes.DEFAULT_CONTENT_TYPE_IS_PUBLISHED);
  }
}

export const saveDefaultContentTypeWithCustomSidebar = {
  willBeSuccessful() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.ContentTypes.SEVERAL,
      uponReceiving: `a request to save content type "${defaultContentTypeId}" with custom sidebar`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}`,
        headers: defaultHeader,
        body: contentTypeWithCustomSidebarRequestBody
      },
      willRespondWith: {
        status: 200,
        body: defaultContentType
      }
    }).as('content-type-custom-sidebar-created');
  }
}

export const publishDefaultContentType = {
  willBeSuccessful() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.ContentTypes.SEVERAL,
      uponReceiving: `a request to publish content type "${defaultContentTypeId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/published`,
        headers: defaultHeader
      },
      willRespondWith: {
        status: 200,
        body: defaultContentType
      }
    }).as('content-type-published-custom-sidebar-created');
  }
}

export const saveDefaultContentTypeEditorInterface = {
  willBeSuccessful() {
    return cy.addInteraction({
      provider: 'content_types',
      state: state.ContentTypes.EDITORINTERFACE_WITHOUT_SIDEBAR,
      uponReceiving: `a request to save the editor interface of content type "${defaultContentTypeId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/editor_interface`,
        headers: defaultHeader,
        body: editorInterfaceWithCustomSidebarRequestBody
      },
      willRespondWith: {
        status: 200,
        body: editorInterfaceWithCustomSidebarResponseBody
      }
    }).as('editor-interface-sidebar-saved');
  }
}
