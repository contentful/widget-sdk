import {
  defaultEnvironmentId,
  defaultHeader,
  defaultSpaceId,
  defaultUserId,
} from '../util/requests';

const locales = require('../fixtures/responses/locales.json');
const localesSeveral = require('../fixtures/responses/locales-several.json');

const putResponse = (name: string, code: string, id: string) => ({
  name: name,
  internal_code: code,
  code: code,
  fallbackCode: null,
  default: false,
  contentManagementApi: true,
  contentDeliveryApi: true,
  optional: false,
  sys: {
    type: 'Locale',
    id: id,
    version: 1,
    space: {
      sys: {
        type: 'Link',
        linkType: 'Space',
        id: defaultSpaceId,
      },
    },
    environment: {
      sys: {
        type: 'Link',
        linkType: 'Environment',
        id: defaultEnvironmentId,
      },
    },
    createdBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: defaultUserId,
      },
    },
    createdAt: '2020-06-30T21:33:42Z',
    updatedBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: defaultUserId,
      },
    },
    updatedAt: '2020-06-30T21:33:42Z',
  },
});

enum States {
  SEVERAL = 'locales/several',
  ONLY_ENGLISH = 'locales/only-english',
  CREATE = 'locale/new',
  DELETE = 'locale/delete',
  CHANGE = 'locale/change',
}

export const queryFirst100LocalesOfDefaultSpace = {
  willFindOne() {
    cy.addInteraction({
      provider: 'locales',
      state: States.ONLY_ENGLISH,
      uponReceiving: `a query for the first 100 locales of the "${defaultSpaceId}" space`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/locales`,
        headers: defaultHeader,
        query: {
          limit: '100',
          skip: '0',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: locales,
      },
    }).as('queryFirst100LocalesOfDefaultSpace');

    return '@queryFirst100LocalesOfDefaultSpace';
  },
  willFindSeveral() {
    cy.addInteraction({
      provider: 'locales',
      state: States.SEVERAL,
      uponReceiving: `a query for the first 100 locales of the "${defaultSpaceId}" space`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/locales`,
        headers: defaultHeader,
        query: {
          limit: '100',
          skip: '0',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: localesSeveral,
      },
    }).as('queryFirst100LocalesOfDefaultSpace');

    return '@queryFirst100LocalesOfDefaultSpace';
  },
};

export const postLocaleForSpace = {
  willCreate(code: string, name: string, id: string) {
    cy.addInteraction({
      provider: 'locales',
      state: States.CREATE,
      uponReceiving: `a post request to create locale "${name} (${code})" in "${defaultSpaceId}" space`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/locales`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: putResponse(name, code, id),
      },
    }).as('postLocaleForSpace');

    return '@postLocaleForSpace';
  },
};

export const putLocaleForSpace = {
  willChange(code: string, name: string, id: string) {
    cy.addInteraction({
      provider: 'locales',
      state: States.CHANGE,
      uponReceiving: `a put request to change locale "${name} (${code})" in "${defaultSpaceId}" space`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/locales/${id}`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.contentful.management.v1+json',
        },
        body: putResponse(name, code, id),
      },
    }).as('putLocaleForSpace');

    return '@putLocaleForSpace';
  },
};

export const deleteLocaleForSpace = {
  willDelete(id: string) {
    cy.addInteraction({
      provider: 'locales',
      state: States.DELETE,
      uponReceiving: `a delete request to delete locale "${id} from "${defaultSpaceId}" space`,
      withRequest: {
        method: 'DELETE',
        path: `/spaces/${defaultSpaceId}/locales/${id}`,
        headers: defaultHeader,
      },
      willRespondWith: {
        status: 204,
      },
    }).as('deleteLocaleForSpace');

    return '@deleteLocaleForSpace';
  },
};
