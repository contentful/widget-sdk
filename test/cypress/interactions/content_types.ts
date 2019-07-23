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

enum States {
  NONE = 'content_types/none',
  EDITORINTERFACE_WITHOUT_SIDEBAR = 'content_types/editor_interface_without_sidebar',
  EDITORINTERFACE_WITH_SIDEBAR = 'content_types/editor_interface_with_sidebar',
  SINGLE = 'content_types/single',
  SEVERAL = 'content_types/several',
  DEFAULT_CONTENT_TYPE_IS_PUBLISHED = 'content_types/default-content-type-is-published',
  NO_PUBLIC_CONTENT_TYPES = 'content_types/no-public-content-types',
  ONLY_ONE_CONTENT_TYPE_IS_PUBLIC = 'content_types/one-single-content-type'
}

const getAllPublicContentTypesInDefaultSpaceRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/public/content_types`,
  headers: defaultHeader,
  query: {
    limit: '1000'
  }
}

export const getAllPublicContentTypesInDefaultSpace = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.NO_PUBLIC_CONTENT_TYPES,
      uponReceiving: `a request for all public content types in space "${defaultSpaceId}"`,
      withRequest: getAllPublicContentTypesInDefaultSpaceRequest,
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('getAllPublicContentTypesInDefaultSpace');

    return '@getAllPublicContentTypesInDefaultSpace';
  },
  // TODO: Is not a good idea to test with a response of a single element against a collection
  // Unless there is a good reason for not doing so, test with several
  willReturnOne() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.ONLY_ONE_CONTENT_TYPE_IS_PUBLIC,
      uponReceiving: `a request for all public content types in space "${defaultSpaceId}"`,
      withRequest: getAllPublicContentTypesInDefaultSpaceRequest,
      willRespondWith: {
        status: 200,
        body: contentTypeSingle
      }
    }).as('getAllPublicContentTypesInDefaultSpace');

    return '@getAllPublicContentTypesInDefaultSpace'
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
  willReturnNone() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.NONE,
      uponReceiving: `a request for all content types in space "${defaultSpaceId}"`,
      withRequest: getAllContentTypesInDefaultSpaceRequest(),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('getAllContentTypesInDefaultSpace');

    return '@getAllContentTypesInDefaultSpace'
  },
  // TODO: Is not a good idea to test with a response of a single element against a collection
  // Unless there is a good reason for not doing so, test with several
  willReturnOne() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.SINGLE,
      uponReceiving: `a request for all content types in space "${defaultSpaceId}"`,
      withRequest: getAllContentTypesInDefaultSpaceRequest(),
      willRespondWith: {
        status: 200,
        body: contentTypeSingle
      }
    }).as('getAllContentTypesInDefaultSpace');

    return '@getAllContentTypesInDefaultSpace';
  }
}

export const getFirst1000ContentTypesInDefaultSpaceOrderedByName = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.NONE,
      uponReceiving: `a request for the first 1000 content types in space "${defaultSpaceId}" ordered by name`,
      withRequest: getAllContentTypesInDefaultSpaceRequest({
        limit: '1000',
        order: 'name'
      }),
      willRespondWith: {
        status: 200,
        body: empty
      }
    }).as('getFirst1000ContentTypesInDefaultSpaceOrderedByName');

    return '@getFirst1000ContentTypesInDefaultSpaceOrderedByName';
  },
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.SEVERAL,
      uponReceiving: `a request for the first 1000 content types in space "${defaultSpaceId}" ordered by name`,
      withRequest: getAllContentTypesInDefaultSpaceRequest({
        limit: '1000',
        order: 'name'
      }),
      willRespondWith: {
        status: 200,
        body: severalContentTypes
      }
    }).as('getFirst1000ContentTypesInDefaultSpaceOrderedByName');

    return '@getFirst1000ContentTypesInDefaultSpaceOrderedByName';
  }
}

const getEditorInterfaceForDefaultContentTypeRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/editor_interface`,
  headers: defaultHeader
}

export const getEditorInterfaceForDefaultContentType = {
  willReturnOneWithoutSidebar() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.EDITORINTERFACE_WITHOUT_SIDEBAR,
      uponReceiving: `a request for the editor interface of content type "${defaultContentTypeId}" in space "${defaultSpaceId}"`,
      withRequest: getEditorInterfaceForDefaultContentTypeRequest,
      willRespondWith: {
        status: 200,
        body: editorInterfaceWithoutSidebarResponseBody
      }
    }).as('getEditorInterfaceForDefaultContentType');

    return '@getEditorInterfaceForDefaultContentType';
  },
  willReturnOneWithSidebar() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.EDITORINTERFACE_WITH_SIDEBAR,
      uponReceiving: `a request for the editor interface of content type "${defaultContentTypeId}" in space "${defaultSpaceId}"`,
      withRequest: getEditorInterfaceForDefaultContentTypeRequest,
      willRespondWith: {
        status: 200,
        body: editorInterfaceWithSidebarResponseBody
      }
    }).as('getEditorInterfaceForDefaultContentType');

    return '@getEditorInterfaceForDefaultContentType';
  }
}

export const getDefaultContentType = {
  willReturnIt() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.SEVERAL,
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
    }).as('getDefaultContentType');

    return '@getDefaultContentType';
  }
}

export const getPublishedVersionOfDefaultContentType = {
  willReturnIt() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.DEFAULT_CONTENT_TYPE_IS_PUBLISHED,
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
    }).as('getPublishedVersionOfDefaultContentType');

    return '@getPublishedVersionOfDefaultContentType';
  }
}

export const saveDefaultContentTypeWithCustomSidebar = {
  willSucceed() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.SEVERAL,
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
    }).as('saveDefaultContentTypeWithCustomSidebar');

    return '@saveDefaultContentTypeWithCustomSidebar';
  }
}

export const publishDefaultContentType = {
  willSucceed() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.SEVERAL,
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
    }).as('publishDefaultContentType');

    return '@publishDefaultContentType';
  }
}

export const saveDefaultContentTypeEditorInterface = {
  willSucceed() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.EDITORINTERFACE_WITHOUT_SIDEBAR,
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
    }).as('saveDefaultContentTypeEditorInterface');

    return '@saveDefaultContentTypeEditorInterface';
  }
}
