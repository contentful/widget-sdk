import {
  defaultSpaceId,
  defaultContentType,
  defaultContentTypeId,
  defaultHeader,
  appContentTypeId,
  defaultEnvironmentId,
} from '../util/requests';
import { RequestOptions, Query } from '@pact-foundation/pact-web';
import {
  createRequestWithNewField,
  createResponseWithNewField,
  createEditorInterfaceRequestWithNewField,
} from '../fixtures/requests/content-types';
import { editorInterfaceResponseWithApp } from '../fixtures/responses/editor-interface-with-app';
import { severalPublicContentTypes } from '../fixtures/responses/content-types-several-public';
import { omit, cloneDeep, set } from 'lodash';

const empty = require('../fixtures/responses/empty.json');
const contentTypeSingle = require('../fixtures/responses/content-types-single.json');
const contentTypeSingleWithRefField = require('../fixtures/responses/content-types-single-with-ref-field.json');
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
  EDITORINTERFACE_WITH_APP = 'content_types/editor_interface_with_app',
  SINGLE = 'content_types/single',
  SEVERAL = 'content_types/several',
  DEFAULT_CONTENT_TYPE_IS_PUBLISHED = 'content_types/default-content-type-is-published',
  CONTENT_TYPE_APP_IMAGE_FOCAL_POINT = 'content_types/app-image-focal-point',
  UPDATE_CONTENT_TYPE_APP_IMAGE_FOCAL_POINT = 'content_types/update-app-image-focal-point',
  NO_PUBLIC_CONTENT_TYPES = 'content_types/no-public-content-types',
  ONLY_ONE_CONTENT_TYPE_IS_PUBLIC = 'content_types/one-single-content-type',
  ONLY_ONE_CONTENT_TYPE_WITH_REF_FIELD_IS_PUBLIC = 'content_types/one-single-content-type-with-ref-field',
  ONLY_ONE_CONTENT_TYPE_WITH_VALIDATION_IS_PUBLIC = 'content_types/one-single-content-type-with-validation',
  SEVERAL_CONTENT_TYPES_ARE_PUBLIC = 'content_types/several-public',
}

const getAllPublicContentTypesInDefaultSpaceRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/public/content_types`,
  headers: defaultHeader,
  query: {
    limit: '1000',
  },
};

export const getAllPublicContentTypesInDefaultSpace = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.NO_PUBLIC_CONTENT_TYPES,
      uponReceiving: `a request for all public content types in space "${defaultSpaceId}"`,
      withRequest: getAllPublicContentTypesInDefaultSpaceRequest,
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: empty,
      },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: contentTypeSingle,
      },
    }).as('getAllPublicContentTypesInDefaultSpace');

    return '@getAllPublicContentTypesInDefaultSpace';
  },
  willReturnOneWithRefField() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.ONLY_ONE_CONTENT_TYPE_WITH_REF_FIELD_IS_PUBLIC,
      uponReceiving: `a request for all public content types in space "${defaultSpaceId}" with a reference field`,
      withRequest: getAllPublicContentTypesInDefaultSpaceRequest,
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: contentTypeSingleWithRefField,
      },
    }).as('getAllPublicContentTypesInDefaultSpaceWithRefField');

    return '@getAllPublicContentTypesInDefaultSpaceWithRefField';
  },
  willReturnOneWithValidation() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.ONLY_ONE_CONTENT_TYPE_WITH_VALIDATION_IS_PUBLIC,
      uponReceiving: `a request for all public content types in space "${defaultSpaceId}" with a validation`,
      withRequest: getAllPublicContentTypesInDefaultSpaceRequest,
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: set(
          cloneDeep(contentTypeSingle),
          ['items', 0, 'fields', 0, 'validations'],
          [
            {
              prohibitRegexp: {
                pattern: 'invalid',
                flags: null,
              },
              message: 'Invalid field value from cypress',
            },
          ]
        ),
      },
    }).as('getAllPublicContentTypesInDefaultSpaceWithValidation');

    return '@getAllPublicContentTypesInDefaultSpaceWithValidation';
  },
  willReturnSeveral() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.SEVERAL_CONTENT_TYPES_ARE_PUBLIC,
      uponReceiving: `a request for multiple public content types in space ${defaultSpaceId}`,
      withRequest: getAllPublicContentTypesInDefaultSpaceRequest,
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalPublicContentTypes,
      },
    }).as('getSeveralPublicContentTypesInDefaultSpace');

    return '@getSeveralPublicContentTypesInDefaultSpace';
  },
};

function getAllContentTypesInDefaultSpaceRequest(query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/content_types`,
    headers: defaultHeader,
    query,
  };
}

function getAllContentTypesInDefaultSpaceEnvironmentRequest(query?: Query): RequestOptions {
  return {
    method: 'GET',
    path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/content_types`,
    headers: defaultHeader,
    query,
  };
}

export const getAllContentTypesInDefaultSpace = {
  willReturnNone(withEnvironment = false) {
    cy.addInteraction({
      provider: 'content_types',
      state: States.NONE,
      uponReceiving: `a request for all content types in space "${defaultSpaceId}"`,
      withRequest: withEnvironment
        ? getAllContentTypesInDefaultSpaceEnvironmentRequest()
        : getAllContentTypesInDefaultSpaceRequest(),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: empty,
      },
    }).as('getAllContentTypesInDefaultSpace');

    return '@getAllContentTypesInDefaultSpace';
  },
  // TODO: Is not a good idea to test with a response of a single element against a collection
  // Unless there is a good reason for not doing so, test with several
  willReturnOne(withEnvironment = false) {
    cy.addInteraction({
      provider: 'content_types',
      state: States.SINGLE,
      uponReceiving: `a request for all content types in space "${defaultSpaceId}"`,
      withRequest: withEnvironment
        ? getAllContentTypesInDefaultSpaceEnvironmentRequest()
        : getAllContentTypesInDefaultSpaceRequest(),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: contentTypeSingle,
      },
    }).as('getAllContentTypesInDefaultSpace');

    return '@getAllContentTypesInDefaultSpace';
  },
};

export const getFirst1000ContentTypesInDefaultSpaceOrderedByName = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.NONE,
      uponReceiving: `a request for the first 1000 content types in space "${defaultSpaceId}" ordered by name`,
      withRequest: getAllContentTypesInDefaultSpaceRequest({
        limit: '1000',
        order: 'name',
      }),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: empty,
      },
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
        order: 'name',
      }),
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: severalContentTypes,
      },
    }).as('getFirst1000ContentTypesInDefaultSpaceOrderedByName');

    return '@getFirst1000ContentTypesInDefaultSpaceOrderedByName';
  },
};

const getEditorInterfaceForDefaultContentTypeRequest: RequestOptions = {
  method: 'GET',
  path: `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/editor_interface`,
  headers: defaultHeader,
};

export const getEditorInterfaceForDefaultContentType = {
  willReturnOneWithoutSidebar() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.EDITORINTERFACE_WITHOUT_SIDEBAR,
      uponReceiving: `a request for the editor interface of content type "${defaultContentTypeId}" in space "${defaultSpaceId}"`,
      withRequest: getEditorInterfaceForDefaultContentTypeRequest,
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: editorInterfaceWithoutSidebarResponseBody,
      },
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
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: editorInterfaceWithSidebarResponseBody,
      },
    }).as('getEditorInterfaceForDefaultContentType');

    return '@getEditorInterfaceForDefaultContentType';
  },
  willReturnEditorInterfaceWithAppInstalled() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.EDITORINTERFACE_WITH_APP,
      uponReceiving: `a request for the editor interface of content type "${appContentTypeId}" in space "${defaultSpaceId}"`,
      withRequest: {
        path: `/spaces/${defaultSpaceId}/content_types/${appContentTypeId}/editor_interface`,
        method: 'GET',
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: editorInterfaceResponseWithApp,
      },
    }).as('getEditorInterfaceForContentTypeWithApp');

    return '@getEditorInterfaceForContentTypeWithApp';
  },
};

export const getDefaultContentType = {
  willReturnIt() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.SEVERAL,
      uponReceiving: `a request to get content type "${defaultContentTypeId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: defaultContentType,
      },
    }).as('getDefaultContentType');

    return '@getDefaultContentType';
  },
};

export const getPublishedVersionOfDefaultContentType = {
  willReturnIt() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.DEFAULT_CONTENT_TYPE_IS_PUBLISHED,
      uponReceiving: `a request to get the published version of content type "${defaultContentTypeId}" in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/published`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: defaultContentType,
      },
    }).as('getPublishedVersionOfDefaultContentType');

    return '@getPublishedVersionOfDefaultContentType';
  },
};

export const saveDefaultContentTypeWithCustomSidebar = {
  willSucceed() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.SEVERAL,
      uponReceiving: `a request to save content type "${defaultContentTypeId}" with custom sidebar`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/content_types/${defaultContentTypeId}`,
        headers: defaultHeader,
        body: omit(contentTypeWithCustomSidebarRequestBody, 'sys'),
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: defaultContentType,
      },
    }).as('saveDefaultContentTypeWithCustomSidebar');

    return '@saveDefaultContentTypeWithCustomSidebar';
  },
};

export const saveDefaultContentTypeWithNewField = {
  willSucceed({
    name,
    apiName,
    type,
    linkType,
    validations,
  }: {
    name: string;
    apiName: string;
    type: string;
    linkType?: string;
    validations?: any;
  }) {
    cy.addInteraction({
      provider: 'content_types',
      state: States.SEVERAL,
      uponReceiving: `a request to save content type "${defaultContentTypeId}" with a new field "${apiName}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/content_types/${defaultContentTypeId}`,
        headers: defaultHeader,
        body: omit(
          createRequestWithNewField({ name, apiName, type, linkType, validations }),
          'sys'
        ),
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: createResponseWithNewField({ name, apiName, type, linkType, validations }),
      },
    }).as(`saveDefaultContentTypeWithNewField${apiName}`);

    return `@saveDefaultContentTypeWithNewField${apiName}`;
  },
};

export const publishDefaultContentTypeWithNewField = {
  willSucceed({
    name,
    apiName,
    type,
    linkType,
    validations,
  }: {
    name: string;
    apiName: string;
    type: string;
    linkType?: string;
    validations?: any;
  }) {
    cy.addInteraction({
      provider: 'content_types',
      state: States.SEVERAL,
      uponReceiving: `a request to publish content type  "${defaultContentTypeId}" with a new field "${apiName}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/content_types/${defaultContentTypeId}/published`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: createResponseWithNewField({ name, apiName, type, linkType, validations }),
      },
    }).as(`publishDefaultContentTypeWithNewField${apiName}`);

    return `@publishDefaultContentTypeWithNewField${apiName}`;
  },
};

export const saveDefaultContentTypeEditorInterfaceWithNewField = {
  willSucceed({ apiName, widgetId }: { apiName: string; widgetId: string }) {
    cy.addInteraction({
      provider: 'content_types',
      state: States.EDITORINTERFACE_WITHOUT_SIDEBAR,
      uponReceiving: `a request to save the editor interface of content type "${defaultContentTypeId}" with new field "${apiName}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/content_types/${defaultContentTypeId}/editor_interface`,
        headers: defaultHeader,
        body: createEditorInterfaceRequestWithNewField({ apiName, widgetId }),
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: createEditorInterfaceRequestWithNewField({ apiName, widgetId }),
      },
    }).as(`saveDefaultContentTypeEditorInterfaceWithNewField${apiName}`);

    return `@saveDefaultContentTypeEditorInterfaceWithNewField${apiName}`;
  },
};

export const publishDefaultContentType = {
  willSucceed() {
    cy.addInteraction({
      provider: 'content_types',
      state: States.SEVERAL,
      uponReceiving: `a request to publish content type "${defaultContentTypeId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/content_types/${defaultContentTypeId}/published`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: defaultContentType,
      },
    }).as('publishDefaultContentType');

    return '@publishDefaultContentType';
  },
};

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
        body: editorInterfaceWithCustomSidebarRequestBody,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: editorInterfaceWithCustomSidebarResponseBody,
      },
    }).as('saveDefaultContentTypeEditorInterface');

    return '@saveDefaultContentTypeEditorInterface';
  },
};
