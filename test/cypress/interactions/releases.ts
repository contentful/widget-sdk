import {
  defaultHeader,
  defaultSpaceId,
  defaultEnvironmentId,
  defaultReleaseId,
  defaultEntryId,
} from '../util/requests';
import { createReleaseRequest } from '../fixtures/requests/releases';

import {
  noReleases,
  severalReleases,
  emptyReleaseResponse,
  severalEntitiesReleaseResponse,
  deleteEntityBodyResponse,
} from '../fixtures/responses/releases';

import { deleteEntityBodyRequest } from '../fixtures/requests/releases';

enum States {
  NONE = 'releases/none',
  SEVERAL = 'releases/several',
  DELETE = 'releases/delete',
  DELETE_ENTITY = 'release/entity/delete',
}

export const getReleasesList = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'releases',
      state: States.NONE,
      uponReceiving: `a request for no releases in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 200,
        body: noReleases(),
      },
    }).as('willReturnNone');

    return '@willReturnNone';
  },

  willReturnSeveral() {
    console.log('severalReleases(): ', severalReleases());
    cy.addInteraction({
      provider: 'releases',
      state: States.SEVERAL,
      uponReceiving: `a request for several releases in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 200,
        body: severalReleases(),
      },
    }).as('willReturnSeveral');

    return '@willReturnSeveral';
  },
};

export const createEmptyRelease = {
  willReturnEmptyRelease() {
    cy.addInteraction({
      provider: 'releases',
      state: States.NONE,
      uponReceiving: `a request to create release in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'POST',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
        body: createReleaseRequest(),
      },
      willRespondWith: {
        status: 200,
        body: emptyReleaseResponse(),
      },
    }).as('willReturnEmptyRelease');

    return '@willReturnEmptyRelease';
  },
};

export const getReleaseEntities = {
  willReturnNone() {
    cy.addInteraction({
      provider: 'releases',
      state: States.NONE,
      uponReceiving: `a request for no release "${defaultReleaseId}" detail in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 200,
        body: emptyReleaseResponse(),
      },
    }).as('willReturnNone');

    return '@willReturnNone';
  },

  willReturnSeveral() {
    cy.addInteraction({
      provider: 'releases',
      state: States.SEVERAL,
      uponReceiving: `a request for several release "${defaultReleaseId}" detail in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'GET',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 200,
        body: severalEntitiesReleaseResponse(),
      },
    }).as('willReturnSeveral');

    return '@willReturnSeveral';
  },
};

export const deleteEntityFromRelease = {
  willSucceed() {
    cy.addInteraction({
      provider: 'releases',
      state: States.DELETE_ENTITY,
      uponReceiving: `a request to delete ${defaultEntryId} from "${defaultReleaseId}"`,
      withRequest: {
        method: 'PUT',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
        body: deleteEntityBodyRequest(),
      },
      willRespondWith: {
        status: 200,
        body: deleteEntityBodyResponse(),
      },
    }).as('willSucceed');

    return '@willSucceed';
  },
};

export const deleteRelease = {
  willSucceed() {
    cy.addInteraction({
      provider: 'releases',
      state: States.DELETE,
      uponReceiving: `a request to delete release ${defaultReleaseId} in space "${defaultSpaceId}"`,
      withRequest: {
        method: 'DELETE',
        path: `/spaces/${defaultSpaceId}/environments/${defaultEnvironmentId}/releases/${defaultReleaseId}`,
        headers: {
          ...defaultHeader,
          'x-contentful-enable-alpha-feature': 'immediate-release',
        },
      },
      willRespondWith: {
        status: 204,
      },
    }).as('willSucceed');

    return '@willSucceed';
  },
};
